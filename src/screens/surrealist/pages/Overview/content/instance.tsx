import {
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
import { Icon, iconChevronRight, iconCloud, Spacer } from "@surrealdb/ui";
import { PropsWithChildren, useMemo, useRef } from "react";
import { Faint } from "~/components/Faint";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudOrganization, CloudRegion } from "~/types";
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
						gap="lg"
						wrap="nowrap"
						mt={-3}
					>
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
						<Spacer />
						<Icon
							c="dimmed"
							path={iconChevronRight}
						/>
					</Group>
					<Group gap="xs">{labels}</Group>
					<Faint containerRef={containerRef} />
				</Paper>
			</Anchor>
		</UnstyledButton>
	);
}
