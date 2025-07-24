import {
	ActionIcon,
	Badge,
	Box,
	BoxProps,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import { PropsWithChildren, useMemo, useRef } from "react";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { InstanceActions } from "~/components/InstanceActions";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import { iconCloud, iconDotsVertical } from "~/util/icons";
import { USER_ICONS } from "~/util/user-icons";
import { StateBadge } from "../badge";
import classes from "../style.module.scss";

export interface StartInstanceProps extends BoxProps {
	instance: CloudInstance;
	onConnect: (instance: CloudInstance) => void;
}

export function StartInstance({
	instance,
	onConnect,
	children,
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
			<Paper
				p="lg"
				variant="interactive"
				className={classes.startInstance}
				ref={containerRef}
				withBorder
			>
				<Group
					wrap="nowrap"
					align="strech"
					flex={1}
				>
					<Stack flex={1}>
						<Group
							wrap="nowrap"
							mt={-3}
						>
							<ThemeIcon
								radius="xs"
								size={36}
								color="slate"
								variant="light"
							>
								<Icon path={connection ? USER_ICONS[connection.icon] : iconCloud} />
							</ThemeIcon>
							<Box flex={1}>
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
							</Box>
						</Group>
					</Stack>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Stop event propagation */}
					<div
						onClick={ON_STOP_PROPAGATION}
						onKeyDown={ON_STOP_PROPAGATION}
					>
						<InstanceActions instance={instance}>
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
		</UnstyledButton>
	);
}
