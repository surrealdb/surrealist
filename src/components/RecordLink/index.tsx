import { Box, type BoxProps, type ElementProps, Group, Transition } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { Icon, iconArrowRight } from "@surrealdb/ui";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import type { RecordId } from "surrealdb";
import { useStable } from "~/hooks/stable";
import { useInspector } from "~/providers/Inspector";
import { getSurrealQL } from "~/screens/surrealist/pages/Connection/connection/connection";
import { HighlightedText } from "../HighlightedText";
import classes from "./style.module.scss";

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

	const { hovered, ref } = useHover();

	return (
		<Group
			{...rest}
			ref={ref}
			wrap="nowrap"
			gap="xs"
			onClick={handleOpen}
			mod={{ withOpen: withOpen !== false }}
			className={classes.root}
		>
			<HighlightedText language="surrealql">{recordText}</HighlightedText>
			{withOpen !== false && (
				<Box w={16}>
					<Transition
						transition="fade-right"
						mounted={hovered}
						duration={100}
						keepMounted
					>
						{(styles) => (
							<Icon
								path={iconArrowRight}
								style={styles}
							/>
						)}
					</Transition>
				</Box>
			)}
		</Group>
	);
}
