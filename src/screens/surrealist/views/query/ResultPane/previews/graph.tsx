import { Box, Center, Divider, Group, Pagination, Stack, Text } from "@mantine/core";
import { useLayoutEffect, useMemo } from "react";
import { useSetting } from "~/hooks/config";
import { type PreviewProps } from ".";
import { usePagination } from "@mantine/hooks";
import { DataTable } from "~/components/DataTable";
import { iconTable } from "~/util/icons";

export function GraphPreview({ responses, selected }: PreviewProps) {
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
			<Center
				h="100%"
				mih={80}
				c="slate"
			>
				<Stack>
					<Icon
						path={iconTable}
						mx="auto"
						size="lg"
					/>
					This response cannot be displayed as a table
				</Stack>
			</Center>
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
