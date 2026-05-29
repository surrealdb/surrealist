/// <reference types="vite/client" />
/// <reference types="wicg-file-system-access" />

interface ImportMetaEnv {
	DATE: string;
	VERSION: string;
	SDB_VERSION: string;
	MODE: string;
	GTM_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
