import { Group, Text } from "@mantine/core";
import { mdiArrowTopRight } from "@mdi/js";
import { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useStable } from "~/hooks/stable";
import { OpenFn } from "~/types";
import { Icon } from "../Icon";

export interface RecordLinkProps extends ComponentPropsWithoutRef<"div"> {
	value: string;
	onRecordClick?: OpenFn;
}

export function RecordLink({ value, onRecordClick, ...rest }: RecordLinkProps) {
	const handleOpen = useStable((e: MouseEvent) => {
		onRecordClick?.(value);
		e.stopPropagation();
	});

	return (
		<Group
			{...rest}
			noWrap
			c="surreal"
			spacing={0}
			onClick={handleOpen}
			style={{
				cursor: onRecordClick ? "pointer" : undefined,
			}}>
			<Text
				ff="JetBrains Mono"
				style={{
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "ellipsis",
					maxWidth: 300,
				}}>
				{value}
			</Text>
			{onRecordClick && <Icon path={mdiArrowTopRight} right />}
		</Group>
	);
}
