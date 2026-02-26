import {
	Anchor,
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Switch,
	Text,
} from "@mantine/core";
import { Icon, iconAuth, iconTarget, Spacer } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceAccessTypeMutation } from "~/cloud/mutations/network";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudInstanceAccessType } from "~/types";
import classes from "../style.module.scss";

export interface ConfigurationNetworkProps {
	instance: CloudInstance;
	onClose: () => void;
}

function accessTypeToFlags(accessType: CloudInstanceAccessType) {
	return {
		public_traffic: accessType === "public" || accessType === "dual",
		private_traffic: accessType === "private" || accessType === "dual",
	};
}

function flagsToAccessType(
	publicTraffic: boolean,
	privateTraffic: boolean,
): CloudInstanceAccessType {
	if (publicTraffic && privateTraffic) return "dual";
	if (privateTraffic) return "private";
	return "public";
}

export function ConfigurationNetwork({ instance, onClose }: ConfigurationNetworkProps) {
	const initial = accessTypeToFlags(instance.access_type);

	const [publicTraffic, setPublicTraffic] = useState(initial.public_traffic);
	const [privateTraffic, setPrivateTraffic] = useState(initial.private_traffic);

	const { mutateAsync } = useUpdateInstanceAccessTypeMutation(instance.id);
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const accessType = useMemo(
		() => flagsToAccessType(publicTraffic, privateTraffic),
		[publicTraffic, privateTraffic],
	);

	const isUnchanged = accessType === instance.access_type;
	const isInvalid = !publicTraffic && !privateTraffic;

	const handleUpdate = useStable(() => {
		confirmUpdate(accessType);
		onClose();
	});

	return (
		<Stack
			h="100%"
			gap={0}
		>
			<Divider />

			<Box
				pos="relative"
				flex={1}
			>
				<Box
					pos="absolute"
					inset={0}
					className={classes.scrollArea}
					style={{ overflow: "auto" }}
				>
					<Stack
						gap="sm"
						p="xl"
						mih="100%"
					>
						<Box mb="xl">
							<Text
								fz="xl"
								c="bright"
								fw={600}
							>
								Manage network access
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								Configure how traffic can reach your instance by enabling public
								access, private access, or both.
							</Text>
						</Box>

						<Group>
							<PrimaryTitle>Network Access</PrimaryTitle>
							{isInvalid && (
								<Badge
									color="red"
									variant="light"
								>
									Select at least one option
								</Badge>
							)}
						</Group>

						<SimpleGrid cols={2}>
							<TrafficCard
								icon={iconTarget}
								label="Public"
								description="Allow public traffic to access your instance."
								value={publicTraffic}
								onChange={setPublicTraffic}
							/>
							<TrafficCard
								icon={iconAuth}
								label="Private"
								description="Allow private traffic to access your instance."
								value={privateTraffic}
								onChange={setPrivateTraffic}
							/>
						</SimpleGrid>
					</Stack>
				</Box>
			</Box>

			<Group p="xl">
				<Button
					onClick={onClose}
					variant="light"
					flex={1}
				>
					Close
				</Button>
				<Button
					type="submit"
					variant="gradient"
					disabled={isUnchanged || isInvalid}
					onClick={handleUpdate}
					flex={1}
				>
					Apply network access
				</Button>
			</Group>
		</Stack>
	);
}

interface TrafficCardProps {
	icon: string;
	label: string;
	description: string;
	value: boolean;
	onChange: (value: boolean) => void;
}

function TrafficCard({ icon, label, description, value, onChange }: TrafficCardProps) {
	return (
		<Anchor variant="glow">
			<Paper
				p="lg"
				radius="md"
				onClick={() => onChange(!value)}
				aria-selected={value}
				tabIndex={0}
				role="radio"
				withBorder
				style={{
					borderColor: value ? "var(--surreal-focus-outline)" : undefined,
					cursor: "pointer",
				}}
			>
				<Stack gap="xs">
					<Group>
						<PrimaryTitle fz={18}>{label}</PrimaryTitle>
						<Spacer />
						<Icon
							path={icon}
							c="obsidian"
						/>
					</Group>
					<Text>{description}</Text>
					<Group
						mt="md"
						gap={0}
					>
						<Switch
							style={{ pointerEvents: "none" }}
							checked={value}
							tabIndex={-1}
							readOnly
						/>
						<Badge
							variant="transparent"
							color={value ? "violet" : "slate"}
						>
							{value ? "Enabled" : "Disabled"}
						</Badge>
					</Group>
				</Stack>
			</Paper>
		</Anchor>
	);
}
