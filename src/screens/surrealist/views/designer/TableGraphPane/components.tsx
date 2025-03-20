import { Group } from "@mantine/core";
import { Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { iconBraces, iconRelation } from "~/util/icons";
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
		<Group c={isLight ? "slate.5" : "slate.2"}>
			<Icon path={icon} />
			<Text fz="sm">{reason}</Text>
		</Group>
	);
}
