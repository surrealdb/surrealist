import classes from "./style.module.scss";
import { ActionIcon, Collapse, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { DocsArticleTopic, DocsGroupTopic, DocsLinkTopic, DocsSectionTopic, DocsTopic, isArticle, isGroup, isLink, isSection } from "~/docs/types";
import { useStable } from "~/hooks/stable";
import { iconChevronDown, iconChevronUp, iconOpen } from "~/util/icons";

interface TopicProps<T> {
	active: string;
	entry: T;
	onOpen: (topic: string) => void
}

export function ArticleTopic({ active, entry, onOpen }: TopicProps<DocsArticleTopic>) {

	const onClick = useStable(() => {
		onOpen(entry.id);
	});

	return (
		<Entry
			isActive={active === entry.id}
			className={classes.topic}
			onClick={onClick}
			h={24}
		>
			{entry.title}
		</Entry>
	);
}

export function GroupTopic({ active, entry, onOpen }: TopicProps<DocsGroupTopic>) {

	const onClick = useStable(() => {
		onOpen(entry.children[0].id);
	});

	const hasFocus = entry.children.some((child) => child.id === active);

	return (
		<>
			<Entry
				isActive={active === entry.id}
				className={classes.topic}
				onClick={onClick}
				h={24}
			>
				{entry.title}
			</Entry>
			<Collapse in={hasFocus}>
				<Stack gap="xs" ml="lg">
					{renderTopics(entry.children, active, onOpen)}
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
		>
			{entry.title}
			<Icon path={iconOpen} size="sm" right />
		</Entry>
	);
}

export function SectionTopic({ entry, active, onOpen }: TopicProps<DocsSectionTopic>) {
	const [opened, { toggle }] = useDisclosure(true);

	return (
		<>
			<Group
				mt="lg"
				onClick={toggle}
				style={{ cursor: "pointer" }}
			>
				<Text c="bright" fw={500}>
					{entry.title}
				</Text>
				<Spacer />
				<ActionIcon
					size="xs"
					variant="subtle"
				>
					<Icon path={opened ? iconChevronDown : iconChevronUp} size="sm" />
				</ActionIcon>
			</Group>
			<Collapse in={opened}>
				<Stack gap="xs">
					{renderTopics(entry.topics, active, onOpen)}
				</Stack>
			</Collapse>
		</>
	);
}

export function renderTopics(entries: DocsTopic[], active: string, onOpen: (topic: string) => void) {
	return entries.map((entry) => {
		if (isSection(entry)) {
			return (
				<SectionTopic
					key={entry.id}
					active={active}
					entry={entry}
					onOpen={onOpen}
				/>
			);
		} else if (isLink(entry)) {
			return (
				<LinkTopic
					key={entry.id}
					active={active}
					entry={entry}
					onOpen={onOpen}
				/>
			);
		} else if(isArticle(entry)) {
			return (
				<ArticleTopic
					key={entry.id}
					active={active}
					entry={entry}
					onOpen={onOpen}
				/>
			);
		} else if (isGroup(entry)) {
			return (
				<GroupTopic
					key={entry.id}
					active={active}
					entry={entry}
					onOpen={onOpen}
				/>
			);
		}
	});
}