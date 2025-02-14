import classes from "./style.module.scss";

import clsx from "clsx";
import dayjs from "dayjs";

import {
	Box,
	BoxProps,
	Button,
	Center,
	Flex,
	Group,
	Paper,
	Stack,
	Text,
	Title,
	UnstyledButton,
} from "@mantine/core";

import { iconChevronRight, iconDotsVertical, iconPlay, iconPlus } from "~/util/icons";

import { PropsWithChildren, ReactNode, useRef } from "react";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { type NewsPost } from "~/hooks/newsfeed";
import { useStable } from "~/hooks/stable";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "~/components/ActionButton";

export interface StartConnectionProps extends BoxProps {
	title: ReactNode;
	topText?: ReactNode;
	bottomText?: ReactNode;
	icon: string;
	withOptions?: boolean;
	onConnect: () => void;
}

export function StartConnection({
	title,
	topText,
	bottomText,
	icon,
	withOptions,
	onConnect,
	children,
	...other
}: PropsWithChildren<StartConnectionProps>) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<UnstyledButton
			onClick={onConnect}
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
						<Group gap="sm">
							<Icon
								path={icon}
								c="bright"
							/>
							<Text
								c="bright"
								fw={600}
								fz="lg"
							>
								{title}
							</Text>
						</Group>
						{topText}
						<Spacer />
						{bottomText}
					</Stack>
					<Stack align="center">
						{withOptions && (
							<ActionButton
								label="Options"
								variant="subtle"
								className={classes.connectionOptions}
							>
								<div>
									<Icon path={iconDotsVertical} />
								</div>
							</ActionButton>
						)}
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
				bg="transparent"
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
	subtitle: string;
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
