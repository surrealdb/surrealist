import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { escapeIdent } from "surrealdb";
import { useDatabaseSchema } from "~/hooks/schema";
import {
	executeQueryFirst,
	executeQuerySingle,
} from "~/screens/surrealist/pages/Connection/connection/connection";
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

function buildRecordQuery(
	activeTable: string,
	filter: string,
	sortMode: SortMode,
	limitBy: number,
	startAt: number,
	includeSort = true,
) {
	let fetchQuery = `SELECT * FROM ${escapeIdent(activeTable)}`;

	if (filter) {
		fetchQuery += ` WHERE ${filter}`;
	}

	if (includeSort && sortMode) {
		const [sortField, sortDir] = sortMode;

		fetchQuery += ` ORDER BY ${escapeIdent(sortField)} ${sortDir}`;

		if (sortField !== "id") {
			fetchQuery += `, id ${sortDir}`;
		}
	} else if (filter) {
		fetchQuery += ` ORDER BY id ASC`;
	}

	fetchQuery += ` LIMIT ${limitBy}`;

	if (startAt > 0) {
		fetchQuery += ` START ${startAt}`;
	}

	return fetchQuery;
}

async function countTableRecords(activeTable: string, filter: string) {
	let countQuery = `SELECT count() AS count FROM ${escapeIdent(activeTable)}`;

	if (filter) {
		countQuery += ` WHERE ${filter}`;
	}

	countQuery += " GROUP ALL";

	const response = await executeQuerySingle(countQuery);

	return response?.count || 0;
}

export function useRecordQuery(input: RecordQueryInput) {
	const schema = useDatabaseSchema();

	return useQuery<{ records: any[]; headers: string[] }>({
		queryKey: ["explorer", "records", input],
		placeholderData: keepPreviousData,
		retryDelay: 500,
		queryFn: async () => {
			const { activeTable, currentPage, pageSize, sortMode, isFilterValid, filter } = input;

			if (!activeTable || !isFilterValid) {
				throw new Error("Invalid query input");
			}

			const limitBy = pageSize;
			const startAt = (currentPage - 1) * pageSize;

			let fetchQuery = buildRecordQuery(activeTable, filter, sortMode, limitBy, startAt);

			let records = (await executeQueryFirst(fetchQuery)) || [];

			// Sorting on a column with no values causes SurrealDB to return zero rows.
			// Fall back to an unsorted query when records exist but the sort yields none.
			if (records.length === 0 && sortMode && sortMode[0] !== "id") {
				const recordCount = await countTableRecords(activeTable, filter);

				if (recordCount > 0) {
					fetchQuery = buildRecordQuery(
						activeTable,
						filter,
						sortMode,
						limitBy,
						startAt,
						false,
					);

					records = (await executeQueryFirst(fetchQuery)) || [];
				}
			}

			const table = schema.tables.find((t) => t.schema.name === activeTable);
			const fields = table?.fields || [];
			const headers = fields
				.filter((f) => !f.name.includes("[*]") && !f.name.includes("."))
				.map((f) => parseIdent(f.name));

			return {
				records,
				headers,
			};
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
				return await countTableRecords(activeTable, filter);
			} catch {
				return 0;
			}
		},
	});
}
