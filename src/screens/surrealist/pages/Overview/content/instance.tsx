import {
	ActionIcon,
	Anchor,
	Badge,
	BoxProps,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconCloud, iconDotsVertical, Spacer } from "@surrealdb/ui";
import { PropsWithChildren, useMemo, useRef } from "react";
import { Faint } from "~/components/Faint";
import { InstanceActions } from "~/components/InstanceActions";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudOrganization, CloudRegion } from "~/types";
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import { USER_ICONS } from "~/util/user-icons";
import { StateBadge } from "../badge";

export interface StartInstanceProps extends BoxProps {
	instance: CloudInstance;
	regions: CloudRegion[];
	organisation: CloudOrganization;
	onConnect: (instance: CloudInstance) => void;
}

export function StartInstance({
	instance,
	organisation,
	regions,
	onConnect,
	...other
}: PropsWithChildren<StartInstanceProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const connections = useConnectionList();

	const connection = useMemo(() => {
		return connections.find((c) => c.authentication.cloudInstance === instance.id);
	}, [connections, instance.id]);

	const handleConnect = useStable(() => {
		if (instance.state === "deleting") {
			return;
		}

		onConnect(instance);
	});

	const labels = connection?.labels?.map((label, i) => (
		<Badge
			key={i}
			color="obsidian"
			variant="light"
		>
			{label}
		</Badge>
	));

	return (
		<UnstyledButton
			onClick={handleConnect}
			{...other}
		>
			<Anchor
				variant="glow"
				c="var(--mantine-color-text)"
			>
				<Paper
					p="lg"
					ref={containerRef}
				>
					<Group
						wrap="nowrap"
						align="strech"
						mt={-3}
					>
						<Group gap="lg">
							<ThemeIcon
								color="obsidian"
								variant="light"
								size="xl"
							>
								<Icon
									size="md"
									path={connection ? USER_ICONS[connection.icon] : iconCloud}
								/>
							</ThemeIcon>
							<Stack gap="xs">
								<Group>
									<Text
										c="bright"
										fw={600}
										fz="xl"
									>
										{instance.name}
									</Text>
									<StateBadge
										size={10}
										state={instance.state}
									/>
								</Group>
								<Text>SurrealDB {instance.version}</Text>
								<Text size="sm">
									{regions.find((r) => r.slug === instance.region)?.description}
								</Text>
							</Stack>
						</Group>
						<Spacer />
						{/* biome-ignore lint/a11y/noStaticElementInteractions: Stop event propagation */}
						<div
							onClick={ON_STOP_PROPAGATION}
							onKeyDown={ON_STOP_PROPAGATION}
						>
							<InstanceActions
								instance={instance}
								organisation={organisation}
							>
								<ActionIcon
									color="slate"
									variant="subtle"
									component="div"
								>
									<Icon path={iconDotsVertical} />
								</ActionIcon>
							</InstanceActions>
						</div>
					</Group>
					<Group gap="xs">{labels}</Group>
					<Faint containerRef={containerRef} />
				</Paper>
			</Anchor>
		</UnstyledButton>
	);
}
