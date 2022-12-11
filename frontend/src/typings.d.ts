export interface SurrealistTab {
	id: string;
	name: string;
	endpoint: string;
	username: string;
	password: string;
	query: string;
	variables: Record<string, string>;
}