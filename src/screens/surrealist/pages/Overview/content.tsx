import classes from "./style.module.scss";

import clsx from "clsx";
import dayjs from "dayjs";

import {
	Box,
	BoxProps,
	Center,
	Flex,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
	UnstyledButton,
} from "@mantine/core";

import { iconChevronRight, iconCloud, iconDotsVertical, iconPlus, iconSandbox } from "~/util/icons";

import { PropsWithChildren, ReactNode, useMemo, useRef } from "react";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { type NewsPost } from "~/hooks/newsfeed";
import { useStable } from "~/hooks/stable";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "~/components/ActionButton";
import { CloudInstance, Connection } from "~/types";
import { useActiveConnection } from "~/hooks/routing";
import { SANDBOX } from "~/constants";
import { useConnectionList } from "~/hooks/connection";
import { StateBadge } from "./badge";
import { USER_ICONS } from "~/util/user-icons";
import { createBaseConnection } from "~/util/defaults";
import { useConfigStore } from "~/stores/config";

export interface StartConnectionProps extends BoxProps {
	connection: Connection;
}

export function StartConnection({
	connection,
	children,
	...other
}: PropsWithChildren<StartConnectionProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [, setActiveConnection] = useActiveConnection();
	const isSandbox = connection.id === SANDBOX;

	const handleConnect = useStable(() => {
		setActiveConnection(connection.id);
	});

	const { protocol, hostname } = connection.authentication;
	const target = protocol === "mem" ? "In-Memory" : protocol === "indxdb" ? "IndexDB" : hostname;

	return (
		<UnstyledButton
			onClick={handleConnect}
			{...other}
		>
			<Paper
				p="lg"
				className={clsx(classes.startBox, classes.startConnection)}
				ref={containerRef}
			>
				<Group
					wrap="nowrap"
					align="strech"
					h="100%"
				>
					<Stack
						flex={1}
						miw={0}
					>
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
								<Icon
									path={isSandbox ? iconSandbox : USER_ICONS[connection.icon]}
								/>
							</ThemeIcon>
							<Box
								flex={1}
								miw={0}
							>
								<Text
									c="bright"
									fw={600}
									fz="xl"
									truncate
								>
									{connection.name}
								</Text>
								<Text
									mt={-4}
									truncate
								>
									{target}
								</Text>
							</Box>
						</Group>
					</Stack>
					<Stack align="center">
						<ActionButton
							label="Options"
							variant="light"
							className={classes.connectionOptions}
						>
							<div>
								<Icon path={iconDotsVertical} />
							</div>
						</ActionButton>
						<Spacer />
						<Icon path={iconChevronRight} />
					</Stack>
				</Group>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}

export interface StartInstanceProps extends BoxProps {
	instance: CloudInstance;
}

export function StartInstance({
	instance,
	children,
	...other
}: PropsWithChildren<StartInstanceProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [, setActiveConnection] = useActiveConnection();
	const connections = useConnectionList();

	const connection = useMemo(() => {
		return connections.find((c) => c.authentication.cloudInstance === instance.id);
	}, [connections, instance.id]);

	const handleConnect = useStable(() => {
		const { settings, addConnection } = useConfigStore.getState();

		if (connection) {
			setActiveConnection(connection.id);
		} else {
			const base = createBaseConnection(settings);

			addConnection({
				...base,
				name: instance.name,
				authentication: {
					...base.authentication,
					protocol: "wss",
					mode: "cloud",
					token: "",
					hostname: instance.host,
					cloudInstance: instance.id,
				},
			});

			setActiveConnection(base.id);
		}
	});

	return (
		<UnstyledButton
			onClick={handleConnect}
			{...other}
		>
			<Paper
				p="lg"
				className={clsx(classes.startBox, classes.startConnection)}
				ref={containerRef}
			>
				<Group
					wrap="nowrap"
					align="strech"
					h="100%"
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
										{connection?.name ?? instance.name}
									</Text>
									<StateBadge state={instance.state} />
								</Group>
								<Text>ID: {instance.id}</Text>
							</Box>
						</Group>
					</Stack>
					<Stack align="center">
						<ActionButton
							label="Options"
							variant="light"
							className={classes.connectionOptions}
						>
							<div>
								<Icon path={iconDotsVertical} />
							</div>
						</ActionButton>
						<Spacer />
						<Icon path={iconChevronRight} />
					</Stack>
				</Group>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}

export interface StartCreatorProps extends BoxProps {
	title: ReactNode;
	subtitle: ReactNode;
	onCreate: () => void;
}

export function StartCreator({
	title,
	subtitle,
	onCreate,
	children,
	...other
}: PropsWithChildren<StartCreatorProps>) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<UnstyledButton
			onClick={onCreate}
			{...other}
		>
			<Paper
				p="lg"
				className={clsx(classes.startBox, classes.startCreator)}
				ref={containerRef}
			>
				<Center h="100%">
					<Stack
						align="center"
						gap={0}
					>
						<Icon path={iconPlus} />
						<Text
							c="bright"
							fw={600}
							fz="lg"
							mt="md"
						>
							{title}
						</Text>
						<Text>{subtitle}</Text>
					</Stack>
				</Center>
			</Paper>
		</UnstyledButton>
	);
}

export interface StartActionProps extends BoxProps {
	title: ReactNode;
	subtitle: ReactNode;
	icon?: string;
	onClick: () => void;
}

export function StartAction({
	title,
	subtitle,
	icon,
	onClick,
	children,
	...other
}: PropsWithChildren<StartActionProps>) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<UnstyledButton
			onClick={onClick}
			{...other}
		>
			<Paper
				p="xl"
				pos="relative"
				ref={containerRef}
				className={clsx(classes.startBox, classes.startAction)}
				renderRoot={(props) => <Stack {...props} />}
			>
				<Group
					wrap="nowrap"
					align="start"
					h="100%"
				>
					<Text
						c="bright"
						fw={600}
						fz="xl"
					>
						{title}
					</Text>
					<Spacer />
					{icon && (
						<Icon
							className={classes.startActionIcon}
							path={icon}
							size="xl"
						/>
					)}
				</Group>
				<Text maw={450}>{subtitle}</Text>
				{children}
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}

export interface StartResourceProps extends BoxProps {
	title: string;
	subtitle?: string;
	icon: string;
	onClick: () => void;
}

export function StartResource({ title, subtitle, icon, onClick, ...other }: StartResourceProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	return (
		<UnstyledButton
			onClick={onClick}
			{...other}
		>
			<Paper
				p="lg"
				className={clsx(classes.startBox, classes.startResource)}
				ref={containerRef}
			>
				<Group
					wrap="nowrap"
					h="100%"
				>
					<Icon
						path={icon}
						mx="md"
						size="xl"
					/>
					<Box flex={1}>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							{title}
						</Text>
						<Text>{subtitle}</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						ml="md"
					/>
				</Group>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}

export interface StartNewsProps extends BoxProps {
	post: NewsPost;
}

export function StartNews({ post, ...other }: StartNewsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const handleClick = useStable(() => {
		dispatchIntent("open-news", { id: post.id });
	});

	return (
		<UnstyledButton
			onClick={handleClick}
			{...other}
		>
			<Paper
				p="lg"
				className={clsx(classes.startBox, classes.startNews)}
				ref={containerRef}
			>
				<Flex
					gap="xl"
					className={classes.startNewsInner}
				>
					<Paper
						className={classes.startNewsThumbnail}
						style={{
							backgroundImage: `url("${post.thumbnail}")`,
						}}
					/>
					<Box
						h="100%"
						flex={1}
						style={{ alignSelf: "start" }}
					>
						<Title
							c="bright"
							fz="xl"
						>
							{post.title}
						</Title>
						<Text c="slate">{dayjs(post.published).fromNow()}</Text>
						<Text mt="sm">{post.description}</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						c="slate"
						size="xl"
						style={{
							alignSelf: "center",
						}}
					/>
				</Flex>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
