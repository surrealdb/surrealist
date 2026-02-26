import { Anchor, Badge, Group, Paper, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import { Icon, iconAuth, iconTarget, Spacer, useStable } from "@surrealdb/ui";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { DeploySectionProps } from "../types";

export function NetworkAccessSection({ details, setDetails }: DeploySectionProps) {
	const setPublicTraffic = useStable((value: boolean) => {
		setDetails((draft) => {
			draft.public_traffic = value;
		});
	});

	const setPrivateTraffic = useStable((value: boolean) => {
		setDetails((draft) => {
			draft.private_traffic = value;
		});
	});

	return (
		<Stack gap="lg">
			<Group>
				<PrimaryTitle>Network Access</PrimaryTitle>
				{!details.public_traffic && !details.private_traffic && (
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
					value={details.public_traffic}
					onChange={setPublicTraffic}
				/>
				<TrafficCard
					icon={iconAuth}
					label="Private"
					description="Allow private traffic to access your instance."
					value={details.private_traffic}
					onChange={setPrivateTraffic}
				/>
			</SimpleGrid>
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
