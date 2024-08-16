import { Group, Title } from "@mantine/core";
import { iconRelation, iconBraces } from "~/util/icons";
import { GraphWarning } from "./helpers";
import { Icon } from "~/components/Icon";
import { Text } from "@mantine/core";

export interface GraphWarningProps {
	warning: GraphWarning;
}

export function GraphWarningLine({
	warning
}: GraphWarningProps) {
	return warning.type === "edge" ? (
		<Group>
			<Icon path={iconRelation} />
			<Text fz="sm">
				Edge <Text c="bright" span>{warning.table}</Text> references invalid {warning.direction} table <Text c="bright" span>{warning.foreign}</Text>
			</Text>
		</Group>
	) : (
		<Group>
			<Icon path={iconBraces} />
			<Text fz="sm">
				Field "<Text c="bright" span>{warning.field}</Text>" on <Text c="bright" span>{warning.table}</Text> references invalid table <Text c="bright" span>{warning.foreign}</Text>
			</Text>
		</Group>
	);
}

export interface HelpTitleProps {
	isLight: boolean;
	children: React.ReactNode;
}

export function HelpTitle({ isLight, children }: HelpTitleProps) {
	return (
		<Title order={2} size={14} c={isLight ? "slate.9" : "white"} fw={600}>
			{children}
		</Title>
	);
}