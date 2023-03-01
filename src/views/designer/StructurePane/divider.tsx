import { Divider } from "@mantine/core";

export interface SectionDividerProps {
	isLight: boolean;
}

export function SectionDivider(props: SectionDividerProps) {
	return (
		<Divider color={props.isLight ? 'gray.2' : 'gray.8'} />
	)
}