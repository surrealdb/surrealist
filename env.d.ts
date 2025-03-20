/// <reference types="vite/client" />

interface ImportMetaEnv {
	DATE: string;
	VERSION: string;
	SDB_VERSION: string;
	MODE: string;
	POSTHOG_KEY: string;
	POSTHOG_URL: string;
	GTM_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}