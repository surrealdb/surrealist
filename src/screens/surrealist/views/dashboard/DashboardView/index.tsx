import classes from "./style.module.scss";
import { ActionIcon, CopyButton, Group, SimpleGrid, Skeleton, Text } from "@mantine/core";

import { Box, ScrollArea, Stack } from "@mantine/core";
import { Redirect } from "wouter";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useConnection } from "~/hooks/connection";
import { iconCheck, iconCopy } from "~/util/icons";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { ConfigurationBlock } from "../ConfigurationBlock";
import { ConnectBlock } from "../ConnectBlock";
import { UpdateBlock } from "../UpdateBlock";
import { useUpdateInstanceMutation } from "~/cloud/mutations/update";
import { useConfirmation } from "~/providers/Confirmation";

export function DashboardView() {
	const [isCloud, instance, name] = useConnection((c) => [
		c?.authentication.mode === "cloud",
		c?.authentication.cloudInstance,
		c?.name ?? "",
	]);

	const { data: details, isPending: detailsPending } = useCloudInstanceQuery(instance);
	// const { data: usage, isPending: usagePending } = useCloudUsageQuery(instance);
	const { mutateAsync: update } = useUpdateInstanceMutation(instance);

	const handleUpdate = useConfirmation({
		title: "Start update?",
		message:
			"Your instance will experience temporary downtime during the update process. Do you wish to proceed?",
		dismissText: "Cancel",
		confirmText: "Update now",
		confirmProps: {
			variant: "gradient",
		},
		onConfirm: async (version: string) => {
			update(version);
		},
	});

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
					maw={1100}
					h="100%"
					gap="xl"
				>
					<Box mb={38}>
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
						{detailsPending ? (
							<Skeleton
								w="100%"
								maw={500}
								height={18}
								my={2}
							/>
						) : (
							<Group gap="sm">
								<Text fz="md">{details?.host}</Text>
								<CopyButton value={instance ?? ""}>
									{({ copied, copy }) => (
										<ActionIcon
											variant={copied ? "gradient" : undefined}
											size="sm"
											onClick={copy}
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
						)}
					</Box>

					<UpdateBlock
						instance={details}
						onUpdate={handleUpdate}
					/>

					<SimpleGrid
						cols={2}
						spacing="xl"
					>
						<ConfigurationBlock
							instance={details}
							onUpdate={handleUpdate}
						/>
						<ConnectBlock instance={details} />
					</SimpleGrid>

					{/* <SimpleGrid
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
					</SimpleGrid> */}
				</Stack>
			</ScrollArea>
		</Box>
	);
}

export default DashboardView;
