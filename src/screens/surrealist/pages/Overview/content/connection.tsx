import {
	Badge,
	BoxProps,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconChevronRight, iconSurreal, Spacer } from "@surrealdb/ui";
import { PropsWithChildren, useRef } from "react";
import { SANDBOX } from "~/constants";
import { useStable } from "~/hooks/stable";
import { Connection } from "~/types";
import { USER_ICONS } from "~/util/user-icons";

export interface StartConnectionProps extends BoxProps {
	connection: Connection;
	onConnect: (connection: Connection) => void;
}

export function StartConnection({
	connection,
	onConnect,
	children,
	...other
}: PropsWithChildren<StartConnectionProps>) {
	const { protocol, hostname } = connection.authentication;

	const containerRef = useRef<HTMLDivElement>(null);
	const isSandbox = connection.id === SANDBOX;
	const isManaged = isSandbox || connection.instance;
	const target = protocol === "mem" ? "In-Memory" : protocol === "indxdb" ? "IndexDB" : hostname;

	const handleConnect = useStable(() => {
		onConnect(connection);
	});

	const labels = connection?.labels?.map((label, i) => (
		<Badge
			key={i}
			size="sm"
			color="violet"
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
				withBorder
				radius="md"
				ref={containerRef}
			>
				<Group
					wrap="nowrap"
					mt={-3}
				>
					<ThemeIcon
						size="xl"
						variant="light"
					>
						<Icon
							size={isSandbox ? "lg" : "md"}
							path={isSandbox ? iconSurreal : USER_ICONS[connection.icon]}
						/>
					</ThemeIcon>
					<Stack gap={0}>
						<Group gap="sm">
							<Text
								c="bright"
								fw={600}
								fz="xl"
								truncate
							>
								{connection.name}
							</Text>

							{isManaged ? (
								<Text
									fw={600}
									fz="xs"
									variant="gradient"
								>
									BUILT-IN
								</Text>
							) : (
								<Group gap="xs">{labels}</Group>
							)}
						</Group>
						<Text truncate>
							{isSandbox ? "Your personal offline playground" : target}
						</Text>
					</Stack>
					<Spacer />
					<Icon
						c="dimmed"
						path={iconChevronRight}
					/>
				</Group>
			</Paper>
		</UnstyledButton>
	);
}
