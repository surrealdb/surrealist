import { RecordId } from "surrealdb.js";
import { Group, Text } from "@mantine/core";
import { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "../Icon";
import { useInspector } from "~/providers/Inspector";
import { iconArrowUpRight } from "~/util/icons";
import { formatValue } from "~/util/surrealql";

export interface RecordLinkProps extends ComponentPropsWithoutRef<"div"> {
	value: RecordId;
}

export function RecordLink({ value, ...rest }: RecordLinkProps) {
	const { inspect } = useInspector();
	const recordText = formatValue(value);

	const handleOpen = useStable((e: MouseEvent) => {
		e.stopPropagation();
		inspect(recordText);
	});

	return (
		<Group
			{...rest}
			wrap="nowrap"
			c="surreal.5"
			gap={0}
			onClick={handleOpen}
			style={{
				cursor: "pointer"
			}}
		>
			<Text
				ff="JetBrains Mono"
				fw={600}
				style={{
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "ellipsis",
					maxWidth: 300,
				}}>
				{recordText}
			</Text>
			<Icon path={iconArrowUpRight} right />
		</Group>
	);
}
