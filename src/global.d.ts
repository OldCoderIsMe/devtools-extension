export {};

declare global {
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
    };
  }
}

