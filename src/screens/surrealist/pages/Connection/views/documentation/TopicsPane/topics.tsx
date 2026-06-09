import { ActionIcon, Collapse, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconChevronDown, iconChevronUp, iconOpen } from "@surrealdb/ui";
import { adapter } from "~/adapter";
import { Entry } from "~/components/Entry";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import {
	type DocsArticleTopic,
	type DocsGroupTopic,
	type DocsLinkTopic,
	type DocsSectionTopic,
	type DocsTopic,
	isArticle,
	isGroup,
	isLink,
	isSection,
} from "~/screens/surrealist/pages/Connection/docs/types";
import type { CodeLang } from "~/types";
import classes from "./style.module.scss";

interface TopicProps<T> {
	active: string;
	entry: T;
	lang: CodeLang;
	onOpen: (topic: string) => void;
}

export function ArticleTopic({ active, entry, onOpen }: TopicProps<DocsArticleTopic>) {
	const isActive = active === entry.id;

	const onClick = useStable(() => {
		onOpen(entry.id);
	});

	return (
		<Entry
			isActive={isActive}
			className={classes.topic}
			onClick={onClick}
			h={24}
			fw={400}
			opacity={isActive ? 1 : 0.75}
		>
			{entry.title}
		</Entry>
	);
}

export function GroupTopic({ active, entry, lang, onOpen }: TopicProps<DocsGroupTopic>) {
	const isActive = active === entry.id;

	const onClick = useStable(() => {
		onOpen(entry.children[0].id);
	});

	const hasFocus = entry.children.some((child) => child.id === active);

	return (
		<>
			<Entry
				isActive={isActive}
				className={classes.topic}
				onClick={onClick}
				h={24}
				fw={400}
				opacity={isActive ? 1 : 0.75}
			>
				{entry.title}
			</Entry>
			<Collapse expanded={hasFocus}>
				<Stack
					gap="xs"
					ml="lg"
				>
					{renderTopics(entry.children, active, lang, onOpen)}
				</Stack>
			</Collapse>
		</>
	);
}

export function LinkTopic({ entry }: TopicProps<DocsLinkTopic>) {
	return (
		<Entry
			h={24}
			className={classes.topic}
			onClick={() => adapter.openUrl(entry.link)}
		>
			{entry.title}
			<Icon
				path={iconOpen}
				size="sm"
			/>
		</Entry>
	);
}

export function SectionTopic({
	entry,
	active,
	lang,
	onOpen,
	forceOpen,
}: TopicProps<DocsSectionTopic> & { forceOpen?: boolean }) {
	const [opened, { toggle }] = useDisclosure(true);
	const isOpen = forceOpen || opened;

	return (
		<>
			<Group
				mt="lg"
				onClick={toggle}
				style={{ cursor: "pointer" }}
			>
				<Text
					component="h3"
					fz="md"
					fw={600}
					ml="sm"
					c="bright"
				>
					{entry.title}
				</Text>
				<Spacer />
				<ActionIcon
					size="xs"
					variant="subtle"
					aria-label={isOpen ? "Collapse section" : "Expand section"}
				>
					<Icon
						path={isOpen ? iconChevronDown : iconChevronUp}
						size="sm"
					/>
				</ActionIcon>
			</Group>
			<Collapse expanded={isOpen}>
				<Stack gap="xs">{renderTopics(entry.topics, active, lang, onOpen)}</Stack>
			</Collapse>
		</>
	);
}

export function renderTopics(
	entries: DocsTopic[],
	active: string,
	lang: CodeLang,
	onOpen: (topic: string) => void,
	forceOpen = false,
) {
	return entries
		.filter((entry) => {
			return entry?.excludeLanguages?.includes(lang) !== true;
		})
		.map((entry) => {
			if (isSection(entry)) {
				return (
					<SectionTopic
						key={entry.id}
						active={active}
						entry={entry}
						lang={lang}
						onOpen={onOpen}
						forceOpen={forceOpen}
					/>
				);
			}

			if (isLink(entry)) {
				return (
					<LinkTopic
						key={entry.id}
						active={active}
						entry={entry}
						lang={lang}
						onOpen={onOpen}
					/>
				);
			}

			if (isArticle(entry)) {
				return (
					<ArticleTopic
						key={entry.id}
						active={active}
						entry={entry}
						lang={lang}
						onOpen={onOpen}
					/>
				);
			}

			if (isGroup(entry)) {
				return (
					<GroupTopic
						key={entry.id}
						active={active}
						entry={entry}
						lang={lang}
						onOpen={onOpen}
					/>
				);
			}
		});
}
