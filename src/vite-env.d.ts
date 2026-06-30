/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_REF?: string;
  readonly VITE_SUPABASE_PROJECT_NAME?: string;
  readonly VITE_SUPABASE_ORG?: string;
  readonly VITE_SUPABASE_REGION?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_ANDROID_LABEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
