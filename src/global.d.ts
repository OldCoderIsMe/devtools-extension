export {};

declare global {
  interface MarkdownFilePayload {
    path: string;
    name: string;
    content: string;
  }
  interface Window {
    electron?: {
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
      media?: {
        getCameraStatus: () => Promise<string>;
        askForCameraAccess: () => Promise<boolean>;
      };
      markdown?: {
        openFile: () => Promise<{ canceled?: boolean; success?: boolean; error?: string; file?: MarkdownFilePayload }>;
        saveFile: (filePath: string, content: string) => Promise<{ success: boolean; path?: string; error?: string }>;
        saveAs: (content: string, defaultFileName?: string) => Promise<{ canceled?: boolean; success?: boolean; path?: string; name?: string; error?: string }>;
        onFileOpen: (callback: (file: MarkdownFilePayload) => void) => () => void;
      };
    };
  }
}

