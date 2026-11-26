/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** DEVELOPMENT ONLY: 'true' turns on the in-browser mock API on the Vite dev server. Ignored in production builds. */
  readonly VITE_ENABLE_MOCK_AUTH?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

