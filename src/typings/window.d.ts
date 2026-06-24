declare global {
	type ReoIdentityType = "email" | "github" | "linkedin";

	interface ReoIdentity {
		username: string;
		type: ReoIdentityType;
		other_identities?: { username: string; type: ReoIdentityType }[];
		firstname?: string;
		lastname?: string;
		company?: string;
	}

	interface ReoClient {
		init: (options: { clientID: string; dnt?: string[] }) => void;
		identify: (identity: ReoIdentity) => void;
	}

	interface Window {
		dataLayer: object[];
		gtag: (...args: any[]) => void;
		tagEvent: (event: string, data?: object) => Promise<void>;
		Reo?: ReoClient;
	}
}

// This has the be exported so that TypeScript knows that this file is a module with global declarations.
// Without the export, TypeScript will treat this file as a script and will not allow you to declare global variables.
export default {};
