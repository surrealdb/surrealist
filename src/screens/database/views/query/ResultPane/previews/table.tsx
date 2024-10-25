import { Box, Divider, Group, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import { isArray, isObject } from "radash";
import { useLayoutEffect, useMemo } from "react";
import { DataTable } from "~/components/DataTable";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { useSetting } from "~/hooks/config";
import type { PreviewProps } from ".";

export function TablePreview({ responses, selected }: PreviewProps) {
	const { success, result } = responses[selected] ?? { result: null };
	const [editorScale] = useSetting("appearance", "editorScale");

	const results: any[] = isArray(result) ? result : [];
	const pagination = usePagination();

	const textSize = Math.floor(15 * (editorScale / 100));
	const startAt = (pagination.currentPage - 1) * pagination.pageSize;
	const pageSlice = results.slice(startAt, startAt + pagination.pageSize);

	const isValid = useMemo(() => {
		return results.length > 0 && results.every((r) => isObject(r));
	}, [results]);

	useLayoutEffect(() => {
		pagination.setTotal(results.length);
	}, [pagination.setTotal, results.length]);

	return success ? (
		isValid ? (
			<Stack
				flex={1}
				gap="xs"
				align="center"
			>
				<Box
					w="100%"
					flex={1}
					pos="relative"
				>
					<DataTable data={pageSlice} />
				</Box>

				<Divider w="100%" />

				<Group>
					<Pagination store={pagination} />
				</Group>
			</Stack>
		) : (
			<Text
				pl="md"
				pt="sm"
				fz={textSize}
				c="slate"
			>
				This response cannot be displayed as a table
			</Text>
		)
	) : (
		<Text
			pl="md"
			pt="sm"
			fz={textSize}
			c="red"
			ff="mono"
			style={{ whiteSpace: "pre-wrap" }}
		>
			{result}
		</Text>
	);
}
