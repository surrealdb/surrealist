import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSchema } from "~/hooks/schema";
import { executeQueryFirst, executeQuerySingle } from "~/screens/database/connection/connection";

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
	const schema = useSchema();

	return useQuery<{ records: any[], headers: string[] }>({
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
				const [sortCol, sortDir] = sortMode || ["id", "asc"];

				let fetchQuery = `SELECT * FROM ${activeTable}`;

				if (filter) {
					fetchQuery += ` WHERE ${filter}`;
				}

				fetchQuery += ` ORDER BY ${sortCol} ${sortDir} LIMIT ${limitBy}`;

				if (startAt > 0) {
					fetchQuery += ` START ${startAt}`;
				}

				const records = await executeQueryFirst(fetchQuery) || [];
				const headers = schema?.tables
					?.find((t) => t.schema.name === activeTable)
					?.fields?.filter(
						(f) => !f.name.includes("[*]") && !f.name.includes("."),
					)
					?.map((f) => f.name) || [];

				return {
					records,
					headers,
				};
			} catch {
				return { records: [], headers: [] };
			}
		}
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
				let countQuery = `SELECT count() AS count FROM ${activeTable}`;

				if (filter) {
					countQuery += ` WHERE ${filter}`;
				}

				countQuery += " GROUP ALL";

				const response = await executeQuerySingle(countQuery);

				return response?.count || 0;
			} catch {
				return 0;
			}
		}
	});
}