import { Box, ScrollArea, SimpleGrid, Stack } from "@mantine/core";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { DATASETS } from "~/constants";
import { DatasetCard } from "./DatasetCard";
import classes from "./style.module.scss";

export function SampleDataPage() {
	return (
		<Box
			flex={1}
			pos="relative"
		>
			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				mt={18}
			>
				<Stack
					px="xl"
					mx="auto"
					maw={1200}
					pb={68}
				>
					<Box>
						<PageBreadcrumbs
							items={[
								{ label: "Surrealist", href: "/overview" },
								{ label: "Sample Data" },
							]}
						/>
						<PrimaryTitle
							fz={32}
							mt="sm"
						>
							Sample Data
						</PrimaryTitle>
					</Box>

					<SimpleGrid
						cols={4}
						spacing="lg"
					>
						{DATASETS.map((ds) => (
							<DatasetCard
								key={ds.id}
								dataset={ds}
							/>
						))}
					</SimpleGrid>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
