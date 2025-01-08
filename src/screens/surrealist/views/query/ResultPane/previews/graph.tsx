import { Center, Loader, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { useSetting } from "~/hooks/config";
import { type PreviewProps } from ".";
import { iconRelation } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { isArray, isObject } from "radash";
import { Gap, PreparedQuery, RecordId } from "surrealdb";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useQuery } from "@tanstack/react-query";

const RECORDS = new Gap<RecordId[]>([]);
const QUERY = new PreparedQuery(
	"return graph::find_relations($records).map(|$r| [$r[0], $r[1].tb(), $r[2]])",
	{ records: RECORDS },
);

export function GraphPreview({ responses, selected }: PreviewProps) {
	const { success, result } = responses[selected] ?? { result: null };
	const [editorScale] = useSetting("appearance", "editorScale");
	const textSize = Math.floor(15 * (editorScale / 100));

	const flattened = useMemo(() => {
		const ids: RecordId[] = [];

		function flatten(data: any) {
			if (isArray(data)) {
				for (const item of data) {
					flatten(item);
				}
			} else if (isObject(data)) {
				for (const item of Object.values(data)) {
					flatten(item);
				}
			} else if (data instanceof RecordId) {
				ids.push(data);
			}
		}

		flatten(result);

		return ids;
	}, [result]);

	const { data, isFetching } = useQuery({
		queryKey: ["graph", flattened],
		refetchOnWindowFocus: false,
		queryFn: () => {
			console.log("Query");
			return executeQuery(QUERY, [RECORDS.fill(flattened)]);
		},
	});

	return success ? (
		isFetching ? (
			<Center flex={1}>
				<Loader />
			</Center>
		) : !data?.length ? (
			<Center
				h="100%"
				mih={80}
				c="slate"
			>
				<Stack>
					<Icon
						path={iconRelation}
						mx="auto"
						size="lg"
					/>
					This response cannot be visualized as a graph
				</Stack>
			</Center>
		) : (
			<div>{JSON.stringify(data)}</div>
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
