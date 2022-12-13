import { Text } from "@mantine/core";
import { useStoreValue } from "~/store";

export function ResultPane() {
	const results = useStoreValue(state => state.results);

	return (
		<Text ff="monospace">
			{JSON.stringify(results)}
		</Text>
	)
}