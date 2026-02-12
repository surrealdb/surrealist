import {
	Anchor,
	Badge,
	BoxProps,
	Group,
	Image,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconChevronRight, iconCloud, Spacer } from "@surrealdb/ui";
import { PropsWithChildren, useMemo, useRef } from "react";
import { Faint } from "~/components/Faint";
import { REGION_FLAGS } from "~/constants";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudOrganization } from "~/types";
import { USER_ICONS } from "~/util/user-icons";
import { StateBadge } from "../badge";

export interface StartInstanceProps extends BoxProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
	onConnect: (instance: CloudInstance) => void;
}

export function StartInstance({
	instance,
	organisation,
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
			color="slate"
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
						<Stack gap={0}>
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
							<Group>
								<Group gap="sm">
									<Image
										src={REGION_FLAGS[instance.region]}
										w={18}
									/>
									<Text>{instance.region}</Text>
								</Group>
								<Text c="slate">/</Text>
								<Text>SurrealDB {instance.version}</Text>
							</Group>
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
