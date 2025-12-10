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
      get: (keys: string[], callback: (result: Record<string, any>) => void) => void;
      set: (items: Record<string, any>) => void;
    };
  };
} | undefined;