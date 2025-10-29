import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { escapeIdent } from "surrealdb";
import { useDatabaseSchema } from "~/hooks/schema";
import { executeQueryFirst, executeQuerySingle } from "~/screens/surrealist/connection/connection";
import { parseIdent } from "~/util/language";

export type SortMode = [string, "asc" | "desc"] | null;

export interface RecordQueryInput {
	activeTable: string;
	currentPage: number;
	pageSize: number;
	sortMode: SortMode;
	isFilterValid: boolean;
	filter: string;
}

export function useRecordQuery(input: RecordQueryInput) {
	const schema = useDatabaseSchema();

	return useQuery<{ records: any[]; headers: string[] }>({
		queryKey: ["explorer", "records", input],
		placeholderData: keepPreviousData,
		queryFn: async () => {
			const { activeTable, currentPage, pageSize, sortMode, isFilterValid, filter } = input;

			try {
				if (!activeTable || !isFilterValid) {
					throw new Error("Invalid query input");
				}

				const limitBy = pageSize;
				const startAt = (currentPage - 1) * pageSize;

				let fetchQuery = `SELECT * FROM ${escapeIdent(activeTable)}`;

				if (filter) {
					fetchQuery += ` WHERE ${filter}`;
				}

				if (sortMode) {
					const [sortField, sortDir] = sortMode;

					// Sorting defaults to id ascending
					if (sortField !== "id" && sortDir !== "asc") {
						fetchQuery += ` ORDER BY ${sortField} ${sortDir}`;

						if (sortField !== "id") {
							fetchQuery += `, id ${sortDir}`;
						}
					}
				}

				fetchQuery += ` LIMIT ${limitBy}`;

				if (startAt > 0) {
					fetchQuery += ` START ${startAt}`;
				}

				const records = (await executeQueryFirst(fetchQuery)) || [];
				const table = schema.tables.find((t) => t.schema.name === activeTable);
				const fields = table?.fields || [];
				const headers = fields
					.filter((f) => !f.name.includes("[*]") && !f.name.includes("."))
					.map((f) => parseIdent(f.name));

				return {
					records,
					headers,
				};
			} catch {
				return { records: [], headers: [] };
			}
		},
	});
}

export interface PaginationQueryInput {
	activeTable: string;
	isFilterValid: boolean;
	filter: string;
}

export function usePaginationQuery(input: PaginationQueryInput) {
	return useQuery<number>({
		queryKey: ["explorer", "pagination", input],
		queryFn: async () => {
			const { activeTable, isFilterValid, filter } = input;

			if (!activeTable || !isFilterValid) {
				return 0;
			}

			try {
				let countQuery = `SELECT count() AS count FROM ${escapeIdent(activeTable)}`;

				if (filter) {
					countQuery += ` WHERE ${filter}`;
				}

				countQuery += " GROUP ALL";

				const response = await executeQuerySingle(countQuery);

				return response?.count || 0;
			} catch {
				return 0;
			}
		},
	});
}
