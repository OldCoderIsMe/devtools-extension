/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
  }

declare module 'crypto-js' {
  export const MD5: any;
  export const SHA1: any;
  export const SHA256: any;
  export const SHA512: any;
  export const AES: any;
  export const HmacMD5: any;
  export const HmacSHA1: any;
  export const HmacSHA256: any;
  export const HmacSHA512: any;
  export const enc: {
    Utf8: any;
    Base64: any;
  };
  export const mode: {
    ECB: any;
  };
  export const pad: {
    Pkcs7: any;
  };
}

declare module 'qrcode' {
  interface QRCodeOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
  
  const QRCode: {
    toDataURL: (text: string, options?: QRCodeOptions) => Promise<string>;
  };
  
  export default QRCode;
}

declare const chrome: {
  storage: {
    local: {
      get: (
        keys: string | string[] | null,
        callback: (result: Record<string, any>) => void,
      ) => void;
      set: (items: Record<string, any>, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
    };
    session?: {
      get: (
        keys: string | string[] | null,
        callback: (result: Record<string, any>) => void,
      ) => void;
      set: (items: Record<string, any>, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
    };
  };
  runtime?: {
    id?: string;
    lastError?: { message?: string };
    getURL?: (path: string) => string;
    onInstalled?: {
      addListener: (callback: () => void) => void;
    };
    onMessage?: {
      addListener: (
        callback: (message: any, sender?: any, sendResponse?: (response?: any) => void) => any,
      ) => void;
    };
    sendMessage?: (message: any, callback?: (response: any) => void) => void;
  };
  commands?: {
    onCommand?: {
      addListener: (callback: (command: string) => void) => void;
    };
  };
  windows?: {
    create: (properties: Record<string, any>, callback?: (window: any) => void) => void;
    update: (
      windowId: number,
      updateInfo: Record<string, any>,
      callback?: (window: any) => void,
    ) => void;
    onRemoved?: {
      addListener: (callback: (windowId: number) => void) => void;
    };
  };
  devtools?: any;
  contextMenus?: {
    removeAll: (callback?: () => void) => void;
    create: (properties: Record<string, any>) => void;
    onClicked?: {
      addListener: (callback: (info: any, tab?: any) => void) => void;
    };
  };
  action?: {
    openPopup?: () => Promise<void> | void;
  };
  tabs?: {
    create: (properties: { url: string }) => Promise<any> | void;
  };
} | undefined;
