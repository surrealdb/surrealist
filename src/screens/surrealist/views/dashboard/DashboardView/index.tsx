import classes from "./style.module.scss";
import { ActionIcon, CopyButton, Group, SimpleGrid, Text, ThemeIcon } from "@mantine/core";

import { Box, ScrollArea, Stack } from "@mantine/core";
import { Redirect } from "wouter";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudUsageQuery } from "~/cloud/queries/usage";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useConnection } from "~/hooks/connection";
import { iconCheck, iconCloud, iconCopy } from "~/util/icons";
import { USER_ICONS } from "~/util/user-icons";
import { ComputeUsageBlock } from "../ComputeUsageBlock";
import { DiskUsageBlock } from "../DiskUsageBlock";
import { BackupsBlock } from "../BackupsBlock";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { ConfigurationBlock } from "../ConfigurationBlock";

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
					<Group gap="lg">
						<ThemeIcon
							radius="sm"
							size={52}
							color="slate"
							variant="light"
						>
							<Icon
								path={icon ? USER_ICONS[icon] : iconCloud}
								size="xl"
							/>
						</ThemeIcon>
						<Box>
							<Group gap="xs">
								<Group>
									<PrimaryTitle>{name}</PrimaryTitle>
									{details?.state && <StateBadge state={details?.state} />}
								</Group>
								{isRenamed && (
									<Text
										fw={500}
										fz="xl"
										c="slate"
									>
										({details?.name})
									</Text>
								)}
							</Group>
							<Group gap="sm">
								<Text fz="xl">ID: {instance}</Text>
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

					<SimpleGrid
						mt={38}
						cols={2}
						spacing="xl"
					>
						<ConfigurationBlock instance={details} />
						<ComputeUsageBlock
							usage={usage}
							loading={usagePending}
						/>
						{/* <DiskUsageBlock
							usage={usage}
							instance={details}
							loading={usagePending}
						/>
						<BackupsBlock /> */}
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
