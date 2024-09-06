import { Group, Text } from "@mantine/core";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import type { RecordId } from "surrealdb";
import { useStable } from "~/hooks/stable";
import { useInspector } from "~/providers/Inspector";
import { iconArrowUpRight } from "~/util/icons";
import { formatValue } from "~/util/surrealql";
import { Icon } from "../Icon";

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
				cursor: "pointer",
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
				}}
			>
				{recordText}
			</Text>
			<Icon path={iconArrowUpRight} right />
		</Group>
	);
}
