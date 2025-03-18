import classes from "./style.module.scss";

import { Box, ScrollArea } from "@mantine/core";
import { useState } from "react";
import { TopGlow } from "~/components/TopGlow";
import type { CloudInstance } from "~/types";
import { ProvisionForm } from "./form";
import { ProvisionPoller } from "./poller";

export function CreateInstancePage() {
	const [created, setCreated] = useState<CloudInstance | null>(null);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBlock: 75 },
				}}
			>
				{created ? (
					<ProvisionPoller instance={created} />
				) : (
					<ProvisionForm onCreated={setCreated} />
				)}
			</ScrollArea>
		</Box>
	);
}
