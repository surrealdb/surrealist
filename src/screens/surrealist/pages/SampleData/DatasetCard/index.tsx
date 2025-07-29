import { BoxProps, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { PropsWithChildren } from "react";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { Dataset } from "~/types";
import { iconAutoFix } from "~/util/icons";
import { parseDatasetURL } from "~/util/surrealql";
import classes from "./style.module.scss";

export interface DatasetCardProps extends BoxProps {
	dataset: Dataset;
}

export function DatasetCard({ dataset, children, ...other }: PropsWithChildren<DatasetCardProps>) {
	const handleDownload = useStable(() => {
		const url = parseDatasetURL(dataset.id);
		window.open(url, "_blank");
	});

	return (
		<Paper
			p="lg"
			withBorder
			variant="gradient"
			className={classes.datasetCard}
			{...other}
		>
			<Stack
				gap={8}
				flex={1}
			>
				<Text
					c="bright"
					fw={600}
					fz={18}
					ta="center"
				>
					{dataset.name}
				</Text>

				<Text ta="center">{dataset.description}</Text>

				<Spacer />

				<Group>
					<Button
						flex={1}
						size="sm"
						color="slate"
						onClick={handleDownload}
					>
						Download
					</Button>
					<Button
						flex={1}
						size="sm"
						variant="gradient"
						rightSection={<Icon path={iconAutoFix} />}
					>
						Apply
					</Button>
				</Group>
			</Stack>
		</Paper>
	);
}
