/**
 * Wire-format types shared between the main thread (`client.ts`) and
 * the language server Web Worker (`worker.ts`). Keep this file
 * dependency-free so it can be imported from either side.
 */

export type WorkerInbound =
	| {
			kind: "rpc";
			id: number;
			payload: string;
	  }
	| {
			kind: "pushWorkspaceDocument";
			uri: string;
			text: string;
	  }
	| {
			kind: "dropWorkspaceDocument";
			uri: string;
	  }
	| {
			kind: "replaceWorkspace";
			documents: Array<{ uri: string; text: string }>;
	  }
	| {
			kind: "setLiveMetadata";
			defineStrings: string[];
	  }
	| {
			kind: "configuration";
			id: number;
			value: unknown;
	  };

export type WorkerOutbound =
	| {
			kind: "rpcResult";
			id: number;
			payload: string | null;
	  }
	| {
			kind: "rpcError";
			id: number;
			message: string;
	  }
	| {
			kind: "publishDiagnostics";
			uri: string;
			diagnostics: unknown;
	  }
	| {
			kind: "logMessage";
			level: number;
			message: string;
	  }
	| {
			kind: "requestConfiguration";
			id: number;
	  }
	| {
			kind: "ready";
	  }
	| {
			kind: "initError";
			message: string;
	  };
