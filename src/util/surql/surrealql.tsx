/**
 * An interface providing SurrealQL functionality
 */
export interface SurrealQL {
	/**
	 * Validate a query and return an error message if invalid
	 */
	validateQuery(sql: string): string | undefined;

	/**
	 * Validate a where clause and return an error message if invalid
	 */
	validateWhere(where: string): string | undefined;

	/**
	 * Format a value structure to a JSON or SQL string
	 */
	formatValue(value: any, json?: boolean, pretty?: boolean): string;

	/**
	 * Parse an SQL string back into a value structure
	 */
	parseValue<T = unknown>(value: string): T;

	/**
	 * Return the the indexes of the live query statements in the given query
	 */
	getLiveQueries(query: string): number[];

	/**
	 * Format the given query
	 */
	formatQuery(query: string, pretty?: boolean): string;

	/**
	 * Extract the kind records from the given kind
	 */
	extractKindRecords(kind: string): string[];
}
