import { Box, Text } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { DeploySectionProps } from "../types";

export function InstanceTypeSection({ organisation, details, setDetails }: DeploySectionProps) {
	return (
		<Box mt="xl">
			<PrimaryTitle>System configuration</PrimaryTitle>
			<Text
				fz="lg"
				mt="xs"
			>
				Select a recommended configuration to deploy your instance on, or choose a custom
				configuration.
			</Text>
			TODO
		</Box>
	);
}
