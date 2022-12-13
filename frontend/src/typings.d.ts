import { SurrealConnection } from "./surreal";

export interface SurrealistTab {
	id: string;
	name: string;
	query: string;
	variables: Record<string, string>;
	connection: SurrealConnection;
}