import classes from "./style.module.scss";

import { useState } from "react";
import type { CloudInstance } from "~/types";
import { ProvisionPoller } from "./poller";
import { ProvisionForm } from "./form";
import { Box, ScrollArea } from "@mantine/core";
import { TopGlow } from "~/components/TopGlow";

export function ProvisionPage() {
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
