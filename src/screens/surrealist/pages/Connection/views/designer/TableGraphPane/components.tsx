import { Group, Text } from "@mantine/core";
import { Icon, iconBraces, iconRelation } from "@surrealdb/ui";
import { useIsLight } from "~/hooks/theme";
import type { GraphWarning } from "./helpers";

export interface GraphWarningProps {
	warning: GraphWarning;
}

export function GraphWarningLine({ warning }: GraphWarningProps) {
	const isLight = useIsLight();

	const icon = warning.type === "edge" ? iconRelation : iconBraces;
	const reason =
		warning.type === "edge" ? (
			<>
				Edge{" "}
				<Text
					c="bright"
					span
				>
					{warning.table}
				</Text>{" "}
				references invalid {warning.direction} table{" "}
				<Text
					c="bright"
					span
				>
					{warning.foreign}
				</Text>
			</>
		) : (
			<>
				Field "
				<Text
					c="bright"
					span
				>
					{warning.field}
				</Text>
				" on{" "}
				<Text
					c="bright"
					span
				>
					{warning.table}
				</Text>{" "}
				references invalid table{" "}
				<Text
					c="bright"
					span
				>
					{warning.foreign}
				</Text>
			</>
		);

	return (
		<Group c={isLight ? "obsidian.5" : "obsidian.2"}>
			<Icon path={icon} />
			<Text fz="sm">{reason}</Text>
		</Group>
	);
}
