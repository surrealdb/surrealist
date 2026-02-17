import { Button, Group, Text } from "@mantine/core";
import { Icon, iconDownload, iconModuleML, iconOpen } from "@surrealdb/ui";
import { useMemo } from "react";
import { adapter } from "~/adapter";
import { Introduction } from "~/components/Introduction";
import type { SchemaModel } from "~/types";

export interface ModelPanelProps {
	details: SchemaModel;
	onDownload: (model: SchemaModel) => void;
}

export function ModelPanel({ details, onDownload }: ModelPanelProps) {
	const snippet = useMemo(
		() => ({
			title: `Using the model`,
			language: "surrealql",
			code: `
			# Use the SurrealML model in your queries
			ml::${details.name}<${details.version}>({
				# Your variables here
			})					
		`,
		}),
		[details.name, details.version],
	);

	return (
		<Introduction
			title={details.name}
			icon={iconModuleML}
			snippet={snippet}
			rightSection={<Text c="obsidian">Version {details.version}</Text>}
		>
			<Text>
				Upload your SurrealML models directly to SurrealDB and use the power of Machine
				Learning within your queries.
			</Text>
			<Group>
				<Button
					flex={1}
					variant="gradient"
					leftSection={<Icon path={iconDownload} />}
					onClick={() => onDownload(details)}
				>
					Download model
				</Button>
				<Button
					flex={1}
					color="obsidian"
					variant="light"
					rightSection={<Icon path={iconOpen} />}
					onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealml")}
				>
					Learn more
				</Button>
			</Group>
		</Introduction>
	);
}
