import classes from "./style.module.scss";
import {
	ActionIcon,
	Alert,
	Button,
	CopyButton,
	Group,
	Paper,
	SimpleGrid,
	Text,
	ThemeIcon,
} from "@mantine/core";

import { Box, ScrollArea, Stack } from "@mantine/core";
import { Redirect } from "wouter";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudUsageQuery } from "~/cloud/queries/usage";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useConnection } from "~/hooks/connection";
import { iconCheck, iconChevronRight, iconCloud, iconCopy, iconDownload } from "~/util/icons";
import { USER_ICONS } from "~/util/user-icons";
import { ComputeUsageBlock } from "../ComputeUsageBlock";
import { DiskUsageBlock } from "../DiskUsageBlock";
import { BackupsBlock } from "../BackupsBlock";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { ConfigurationBlock } from "../ConfigurationBlock";
import { ConnectBlock } from "../ConnectBlock";

export function DashboardView() {
	const [isCloud, instance, name, icon] = useConnection((c) => [
		c?.authentication.mode === "cloud",
		c?.authentication.cloudInstance,
		c?.name ?? "",
		c?.icon,
	]);

	const { data: details, isPending: detailsPending } = useCloudInstanceQuery(instance);
	const { data: usage, isPending: usagePending } = useCloudUsageQuery(instance);

	const isRenamed = name !== details?.name;

	if (!isCloud) {
		return <Redirect to="/query" />;
	}

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
				viewportProps={{
					style: { paddingBlock: 75 },
				}}
			>
				<Stack
					mx="auto"
					maw={1100}
					h="100%"
					gap="xl"
				>
					<Group
						gap="lg"
						mb={38}
					>
						<Box>
							<Group gap="xs">
								<Group>
									<PrimaryTitle fz={38}>{name}</PrimaryTitle>
									{isRenamed && (
										<Text
											fw={400}
											fz={38}
											c="slate"
										>
											({details?.name})
										</Text>
									)}
									{details?.state && <StateBadge state={details?.state} />}
								</Group>
							</Group>
							<Group gap="sm">
								<Text fz="md">{details?.host}</Text>
								<CopyButton value={instance ?? ""}>
									{({ copied, copy }) => (
										<ActionIcon
											variant={copied ? "gradient" : undefined}
											size="sm"
											onClick={copy}
											className={classes.copy}
											aria-label="Copy id to clipboard"
										>
											<Icon
												path={copied ? iconCheck : iconCopy}
												size="sm"
											/>
										</ActionIcon>
									)}
								</CopyButton>
							</Group>
						</Box>
					</Group>

					<Alert
						color="blue"
						title="Update available"
						icon={<Icon path={iconDownload} />}
					>
						<Box>
							Your instance can be updated to{" "}
							<Text
								span
								fw={800}
							>
								SurrealDB 2.2
							</Text>
						</Box>
						<Button
							rightSection={<Icon path={iconChevronRight} />}
							color="blue"
							size="xs"
							mt="md"
						>
							Update instance
						</Button>
					</Alert>

					<SimpleGrid
						cols={2}
						spacing="xl"
					>
						<ConfigurationBlock instance={details} />
						<ConnectBlock />
					</SimpleGrid>

					<SimpleGrid
						cols={3}
						spacing="xl"
					>
						<ComputeUsageBlock
							usage={usage}
							loading={usagePending}
						/>
						<DiskUsageBlock
							usage={usage}
							instance={details}
							loading={usagePending}
						/>
						<BackupsBlock />
					</SimpleGrid>
				</Stack>
			</ScrollArea>
		</Box>
	);
}

export default DashboardView;
