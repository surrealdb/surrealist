import classes from "./style.module.scss";

import { ActionIcon, Button, CopyButton, Group, SimpleGrid, Skeleton, Text } from "@mantine/core";
import { Box, ScrollArea, Stack } from "@mantine/core";
import { memo, useState } from "react";
import { Redirect } from "wouter";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceVersionMutation } from "~/cloud/mutations/version";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudUsageQuery } from "~/cloud/queries/usage";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { InstanceActions } from "~/components/InstanceActions";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useBoolean } from "~/hooks/boolean";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { iconCheck, iconChevronDown, iconCopy, iconDotsVertical } from "~/util/icons";
import { BackupsBlock } from "../BackupsBlock";
import { ComputeUsageBlock } from "../ComputeUsageBlock";
import { ConfigurationBlock } from "../ConfigurationBlock";
import { ConfiguratorDrawer } from "../ConfiguratorDrawer";
import { ConnectBlock } from "../ConnectBlock";
import { DiskUsageBlock } from "../DiskUsageBlock";
import { UpdateBlock } from "../UpdateBlock";

const UpdateBlockLazy = memo(UpdateBlock);
const ConfigurationBlockLazy = memo(ConfigurationBlock);
const ConnectBlockLazy = memo(ConnectBlock);
const ComputeUsageBlockLazy = memo(ComputeUsageBlock);
const DiskUsageBlockLazy = memo(DiskUsageBlock);
const BackupsBlockLazy = memo(BackupsBlock);
const ConfiguratorDrawerLazy = memo(ConfiguratorDrawer);

export function DashboardView() {
	const [isCloud, instance, name] = useConnection((c) => [
		c?.authentication.mode === "cloud",
		c?.authentication.cloudInstance,
		c?.name ?? "",
	]);

	const { data: details, isPending: detailsPending } = useCloudInstanceQuery(instance);
	const { data: backups, isPending: backupsPending } = useCloudBackupsQuery(instance);
	const { data: usage, isPending: usagePending } = useCloudUsageQuery(instance);

	const { mutateAsync } = useUpdateInstanceVersionMutation(instance);
	const handleUpdate = useUpdateConfirmation(mutateAsync);

	const [configuring, configureHandle] = useBoolean();
	const [activeTab, setActiveTab] = useState("capabilities");

	const handleUpgrade = useStable(() => {
		setActiveTab("type");
		configureHandle.open();
	});

	const handleVersions = useStable(() => {
		setActiveTab("version");
		configureHandle.open();
	});

	const isLoading = detailsPending || backupsPending || usagePending;
	const isRenamed = !detailsPending && name !== details?.name;

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
					maw={1150}
					h="100%"
					gap="xl"
				>
					<Box mb={38}>
						{isLoading ? (
							<>
								<Skeleton
									w="100%"
									maw={250}
									height={41}
									my={10}
								/>
								<Skeleton
									w="100%"
									maw={500}
									height={18}
									my={2}
								/>
							</>
						) : (
							<>
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
									{details?.state && (
										<StateBadge
											mt="xs"
											ml="xs"
											size={14}
											state={details.state}
										/>
									)}
									<Spacer />
									{details && (
										<InstanceActions instance={details}>
											<Button
												color="slate"
												variant="light"
												rightSection={<Icon path={iconChevronDown} />}
											>
												Actions
											</Button>
										</InstanceActions>
									)}
								</Group>
								<Group gap="sm">
									<Text fz="md">{details?.host}</Text>
									<CopyButton value={details?.host ?? ""}>
										{({ copied, copy }) => (
											<ActionIcon
												variant={copied ? "gradient" : undefined}
												size="sm"
												onClick={copy}
												aria-label="Copy hostname to clipboard"
											>
												<Icon
													path={copied ? iconCheck : iconCopy}
													size="sm"
												/>
											</ActionIcon>
										)}
									</CopyButton>
								</Group>
							</>
						)}
					</Box>

					<UpdateBlockLazy
						instance={details}
						onUpdate={handleUpdate}
						onVersions={handleVersions}
					/>

					<SimpleGrid
						cols={2}
						spacing="xl"
					>
						<ConfigurationBlockLazy
							instance={details}
							isLoading={isLoading}
							onConfigure={configureHandle.open}
						/>
						<ConnectBlockLazy
							instance={details}
							isLoading={isLoading}
						/>
					</SimpleGrid>

					<SimpleGrid
						cols={3}
						spacing="xl"
					>
						<ComputeUsageBlockLazy
							usage={usage}
							isLoading={isLoading}
						/>
						<DiskUsageBlockLazy
							usage={usage}
							instance={details}
							isLoading={isLoading}
						/>
						<BackupsBlockLazy
							instance={details}
							backups={backups}
							isLoading={isLoading}
							onUpgrade={handleUpgrade}
						/>
					</SimpleGrid>
				</Stack>
			</ScrollArea>

			{details && (
				<ConfiguratorDrawerLazy
					opened={configuring}
					tab={activeTab}
					instance={details}
					onChangeTab={setActiveTab}
					onClose={configureHandle.close}
					onUpdate={handleUpdate}
				/>
			)}
		</Box>
	);
}

export default DashboardView;
