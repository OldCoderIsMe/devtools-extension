/**
 * MV3 background service worker：负责右键菜单与快速搜索弹窗，并把选中的文本交接给 popup。
 *
 * 该文件不引入任何运行时依赖，避免把 Vue 等代码打进 service worker。
 */
const MENU_ROOT = 'devtools-suite-root';
const HASH_PARENT = 'devtools-hash';
const PENDING_PREFILL_KEY = 'devtools-pending-prefill';
const MAX_SELECTION_LENGTH = 200_000;

const QUICK_SEARCH_PAGE = 'quick-search.html';
const QUICK_SEARCH_WINDOW_KEY = 'devtools-quick-search-window';
const QUICK_SEARCH_COMMAND = 'open-quick-search';
const QUICK_SEARCH_MESSAGE = 'open-quick-search';
const QUICK_SEARCH_WIDTH = 620;
const QUICK_SEARCH_HEIGHT = 430;

interface ContextMenuItem {
  id: string;
  title: string;
  toolId: string;
  action?: string;
}

/** 直接挂在 DevTools Suite 子菜单下的动作 */
const MENU_ITEMS: ContextMenuItem[] = [
  { id: 'urldecode', title: 'URL 解码', toolId: 'url', action: 'decode' },
  { id: 'urlencode', title: 'URL 编码', toolId: 'url', action: 'encode' },
  { id: 'base64-decode', title: 'Base64 解码', toolId: 'md5', action: 'base64-decode' },
  { id: 'json-format', title: 'JSON 格式化', toolId: 'json', action: 'format' },
  { id: 'timestamp', title: '时间戳解析', toolId: 'time', action: 'timestamp' },
  { id: 'unicode-decode', title: 'Unicode 解码', toolId: 'unicode', action: 'to-chinese' },
];

/** “计算哈希”二级菜单 */
const HASH_ITEMS: ContextMenuItem[] = [
  { id: 'hash-md5', title: 'MD5', toolId: 'md5', action: 'md5' },
  { id: 'hash-sha256', title: 'SHA256', toolId: 'md5', action: 'sha256' },
];

const ITEM_MAP: Record<string, ContextMenuItem> = [...MENU_ITEMS, ...HASH_ITEMS].reduce(
  (map, item) => {
    map[item.id] = item;
    return map;
  },
  {} as Record<string, ContextMenuItem>,
);

function createMenus(): void {
  const contextMenus = (chrome as any).contextMenus;
  if (!contextMenus) return;

  contextMenus.removeAll(() => {
    // 读取并清理 lastError，避免控制台出现未处理的错误
    void (chrome as any).runtime?.lastError;

    contextMenus.create({
      id: MENU_ROOT,
      title: 'DevTools Suite',
      contexts: ['selection'],
    });

    MENU_ITEMS.forEach((item) => {
      contextMenus.create({
        id: item.id,
        parentId: MENU_ROOT,
        title: item.title,
        contexts: ['selection'],
      });
    });

    contextMenus.create({
      id: HASH_PARENT,
      parentId: MENU_ROOT,
      title: '计算哈希',
      contexts: ['selection'],
    });

    HASH_ITEMS.forEach((item) => {
      contextMenus.create({
        id: item.id,
        parentId: HASH_PARENT,
        title: item.title,
        contexts: ['selection'],
      });
    });
  });
}

async function openPopup(toolId: string, action?: string): Promise<void> {
  const actionApi = (chrome as any).action;
  if (actionApi?.openPopup) {
    try {
      await actionApi.openPopup();
      return;
    } catch {
      // 部分浏览器版本不支持 openPopup（或不在用户手势内），降级为打开标签页
    }
  }

  const query = action
    ? `?tool=${encodeURIComponent(toolId)}&action=${encodeURIComponent(action)}`
    : `?tool=${encodeURIComponent(toolId)}`;
  const url = (chrome as any).runtime.getURL(`index.html${query}`);
  await (chrome as any).tabs.create({ url });
}

function handleMenuClick(info: any): void {
  const item = ITEM_MAP[String(info.menuItemId)];
  if (!item) return;

  const selection = typeof info.selectionText === 'string' ? info.selectionText : '';
  const truncated = selection.length > MAX_SELECTION_LENGTH;
  const payload = {
    toolId: item.toolId,
    value: truncated ? selection.slice(0, MAX_SELECTION_LENGTH) : selection,
    action: item.action,
    source: 'context-menu' as const,
    createdAt: Date.now(),
    truncated,
    originalLength: selection.length,
  };

  (chrome as any).storage.local.set({ [PENDING_PREFILL_KEY]: payload }, () => {
    void (chrome as any).runtime?.lastError;
    void openPopup(item.toolId, item.action);
  });
}

const runtime = (chrome as any).runtime;
const contextMenus = (chrome as any).contextMenus;

/**
 * 快速搜索弹窗的窗口 id 只保存在 storage.session 中：
 * 浏览器重启后会话存储自动清空，避免用旧 id 误聚焦到其他窗口。
 */
function quickSearchStore(): any {
  return (chrome as any).storage?.session;
}

function readQuickSearchWindowId(): Promise<number | undefined> {
  return new Promise((resolve) => {
    const store = quickSearchStore();
    if (!store?.get) {
      resolve(undefined);
      return;
    }
    try {
      store.get([QUICK_SEARCH_WINDOW_KEY], (result: Record<string, any>) => {
        void (chrome as any).runtime?.lastError;
        const id = result?.[QUICK_SEARCH_WINDOW_KEY];
        resolve(typeof id === 'number' ? id : undefined);
      });
    } catch {
      resolve(undefined);
    }
  });
}

function writeQuickSearchWindowId(windowId?: number): void {
  const store = quickSearchStore();
  if (!store) return;
  try {
    if (typeof windowId === 'number') {
      store.set({ [QUICK_SEARCH_WINDOW_KEY]: windowId });
    } else {
      store.remove([QUICK_SEARCH_WINDOW_KEY]);
    }
  } catch {
    // 存储不可用时忽略，下次直接新建窗口
  }
}

function focusQuickSearchWindow(windowId: number): Promise<boolean> {
  return new Promise((resolve) => {
    const windows = (chrome as any).windows;
    if (!windows?.update) {
      resolve(false);
      return;
    }
    try {
      windows.update(windowId, { focused: true }, (win: any) => {
        const error = (chrome as any).runtime?.lastError;
        resolve(!error && !!win);
      });
    } catch {
      resolve(false);
    }
  });
}

function createQuickSearchWindow(url: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const windows = (chrome as any).windows;
    if (!windows?.create) {
      resolve(undefined);
      return;
    }
    try {
      windows.create(
        {
          url,
          type: 'popup',
          width: QUICK_SEARCH_WIDTH,
          height: QUICK_SEARCH_HEIGHT,
          focused: true,
        },
        (win: any) => {
          void (chrome as any).runtime?.lastError;
          resolve(typeof win?.id === 'number' ? win.id : undefined);
        },
      );
    } catch {
      resolve(undefined);
    }
  });
}

/** 已打开则聚焦，否则新建独立弹窗（Spotlight 风格） */
async function openQuickSearchWindow(): Promise<void> {
  const url = (chrome as any).runtime?.getURL?.(QUICK_SEARCH_PAGE);
  if (!url) return;

  const existingId = await readQuickSearchWindowId();
  if (typeof existingId === 'number' && (await focusQuickSearchWindow(existingId))) {
    return;
  }

  const windowId = await createQuickSearchWindow(url);
  writeQuickSearchWindowId(windowId);
}

const commands = (chrome as any).commands;
commands?.onCommand?.addListener((command: string) => {
  if (command === QUICK_SEARCH_COMMAND) {
    void openQuickSearchWindow();
  }
});

// popup 里的「快速搜索」按钮通过消息复用同一套窗口管理逻辑
runtime?.onMessage?.addListener((message: any) => {
  if (message?.type === QUICK_SEARCH_MESSAGE) {
    void openQuickSearchWindow();
  }
});

const windows = (chrome as any).windows;
windows?.onRemoved?.addListener((windowId: number) => {
  void readQuickSearchWindowId().then((storedId) => {
    if (storedId === windowId) {
      writeQuickSearchWindowId(undefined);
    }
  });
});

runtime?.onInstalled?.addListener(createMenus);
contextMenus?.onClicked?.addListener(handleMenuClick);

// 首次加载（例如开发时重新加载扩展）也确保菜单存在
createMenus();
