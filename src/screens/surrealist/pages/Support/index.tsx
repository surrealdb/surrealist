import { Box, Center, ScrollArea, Stack } from "@mantine/core";
import { adapter } from "~/adapter";
import { HelpCenter } from "~/components/HelpCenter";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import classes from "./style.module.scss";

export function SupportPage() {
	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={250} />

			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				mt={68 + adapter.titlebarOffset}
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
								{ label: "Help & Support" },
							]}
						/>
						<PrimaryTitle
							fz={32}
							mt="sm"
						>
							Help & Support
						</PrimaryTitle>
					</Box>
					<Center
						flex={1}
						pb={75}
						pt="xl"
					>
						<HelpCenter />
					</Center>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
