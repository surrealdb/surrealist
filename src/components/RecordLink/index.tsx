import { Text } from "@mantine/core";
import { mdiArrowTopRight } from "@mdi/js";
import { OpenFn } from "~/typings";
import { Icon } from "../Icon";

export interface RecordLinkProps {
	value: string;
	onRecordClick?: OpenFn;
}

export function RecordLink({ value, onRecordClick }: RecordLinkProps) {
	const handleOpen = onRecordClick
		? () => onRecordClick?.(value)
		: undefined;

	return (
		<Text
			color="surreal"
			ff="JetBrains Mono"
			style={{ cursor: onRecordClick ? 'pointer' : undefined }}
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