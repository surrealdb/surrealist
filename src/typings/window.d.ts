declare global {
	interface Window {
		dataLayer: object[];
		gtag: (...args: any[]) => void;
		tagEvent: (event: string, data?: object) => Promise<void>;
	}
}

// This has the be exported so that TypeScript knows that this file is a module with global declarations.
// Without the export, TypeScript will treat this file as a script and will not allow you to declare global variables.
export default {};