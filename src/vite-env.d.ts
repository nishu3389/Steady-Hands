/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_ADMOB_APP_ID?: string;
  readonly VITE_ADMOB_PUBLISHER_ID?: string;
  readonly VITE_ADMOB_BANNER_UNIT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
