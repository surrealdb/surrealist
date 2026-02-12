import { type BoxProps, type ElementProps, Group, Text } from "@mantine/core";
import { Icon, iconArrowUpRight } from "@surrealdb/ui";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import type { RecordId } from "surrealdb";
import { useStable } from "~/hooks/stable";
import { useInspector } from "~/providers/Inspector";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";

export interface RecordLinkProps extends BoxProps, ElementProps<"div"> {
	value: RecordId;
	withOpen?: boolean;
}

export function RecordLink({ value, withOpen, ...rest }: RecordLinkProps) {
	const { inspect } = useInspector();
	const [recordText, setRecordText] = useState("");

	useEffect(() => {
		let cancelled = false;

		const format = async () => {
			const result = await getSurrealQL().formatValue(value);
			if (!cancelled) {
				setRecordText(result);
			}
		};

		format();

		return () => {
			cancelled = true;
		};
	}, [value]);

	const handleOpen = useStable((e: MouseEvent) => {
		e.stopPropagation();

		if (withOpen !== false) {
			inspect(value);
		}
	});

	return (
		<Group
			{...rest}
			wrap="nowrap"
			c="violet.5"
			gap={0}
			onClick={handleOpen}
			style={{
				cursor: withOpen !== false ? "pointer" : undefined,
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
			{withOpen !== false && <Icon path={iconArrowUpRight} />}
		</Group>
	);
}
