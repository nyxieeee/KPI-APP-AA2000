declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly VITE_LAUNCH_AES_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_BASE_URLS?: string;
  readonly VITE_API_PREFIX?: string;
  readonly VITE_SESSION_LOOKUP_PATH?: string;
  readonly VITE_SESSION_LOOKUP_PATHS?: string;
  readonly VITE_BACKEND_API_URL?: string;
  readonly BACKEND_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

