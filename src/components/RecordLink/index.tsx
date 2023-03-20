import { Text } from "@mantine/core";
import { mdiArrowTopRight } from "@mdi/js";
import { MouseEvent } from "react";
import { useStable } from "~/hooks/stable";
import { OpenFn } from "~/typings";
import { Icon } from "../Icon";

export interface RecordLinkProps {
	value: string;
	onRecordClick?: OpenFn;
}

export function RecordLink({ value, onRecordClick }: RecordLinkProps) {
	
	const handleOpen = useStable((e: MouseEvent) => {
		onRecordClick?.(value);
		e.stopPropagation();
	})

	return (
		<Text
			color="surreal"
			ff="JetBrains Mono"
			style={{ cursor: onRecordClick ? 'pointer' : undefined, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
			onClick={handleOpen}
		>
			{value}
			{onRecordClick && (
				<Icon
					path={mdiArrowTopRight}
					right
				/>
			)}
		</Text>
	)
}