import { Group, Text } from "@mantine/core";
import { mdiArrowTopRight } from "@mdi/js";
import { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "../Icon";
import { useInspector } from "~/providers/Inspector";

export interface RecordLinkProps extends ComponentPropsWithoutRef<"div"> {
	value: string;
}

export function RecordLink({ value, ...rest }: RecordLinkProps) {
	const { inspect } = useInspector();

	const handleOpen = useStable((e: MouseEvent) => {
		e.stopPropagation();
		inspect(value);
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
				{value}
			</Text>
			<Icon path={mdiArrowTopRight} right />
		</Group>
	);
}
