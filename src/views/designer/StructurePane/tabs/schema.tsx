import { Stack, Title } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { SchemaTabProps } from "./helpers";

export function SchemaTab(props: SchemaTabProps) {
	const isLight = useIsLight();

	return (
		<Stack>
			<Title size={16} color={isLight ? 'light.6' : 'white'}>
				General details
			</Title>
		</Stack>
	)
}