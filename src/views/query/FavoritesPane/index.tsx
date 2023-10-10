import classes from "./style.module.scss";

import {
	ActionIcon,
	Box,
	Button,
	Collapse,
	Divider,
	Group,
	Modal,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	TextInput,
	useMantineTheme,
} from "@mantine/core";

import { mdiChevronDown, mdiChevronUp, mdiClose, mdiMagnify, mdiPencil, mdiPlay, mdiPlus, mdiStar } from "@mdi/js";
import { Fragment, useMemo, useState } from "react";
import { useIsLight } from "~/hooks/theme";
import { store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { useInputState } from "@mantine/hooks";
import { FavoritesEntry, SurrealistSession } from "~/types";
import { useActiveQuery, useActiveSession } from "~/hooks/environment";
import { uid } from "radash";
import { Sortable } from "~/components/Sortable";
import { Panel } from "~/components/Panel";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { Form } from "~/components/Form";
import { ModalTitle } from "~/components/ModalTitle";
import { executeQuery } from "~/database";
import { removeFavoritesEntry, setFavorites, addQueryTab, setShowQueryListing, saveFavoritesEntry } from "~/stores/config";
import { openTabCreator } from "~/stores/interface";

export function FavoritesPane() {
	const isLight = useIsLight();
	const activeSession = useActiveSession();
	const entries = useStoreValue((state) => state.config.queryFavorites);
	const queryTab = useActiveQuery();

	const [search, setSearch] = useInputState("");
	const [activeEntry, setActiveEntry] = useState("");
	const [queryName, setQueryName] = useInputState("");
	const [queryText, setQueryText] = useInputState("");
	const [isEditing, setIsEditing] = useState(false);
	const [editingId, setEditingId] = useState("");

	const openSaveBox = useStable(() => {
		setIsEditing(true);
		setQueryName("");
		setQueryText(queryTab.text);
		setEditingId("");
	});

	const closeSaving = useStable(() => {
		setIsEditing(false);
	});

	const saveQuery = useStable(() => {
		setIsEditing(false);

		store.dispatch(saveFavoritesEntry({
			id: editingId || uid(5),
			name: queryName,
			query: queryText,
		}));
	});

	const filtered = useMemo(() => {
		const needle = search.toLowerCase();
		return entries.filter(
			(entry) => entry.name.toLowerCase().includes(needle) || entry.query.toLowerCase().includes(needle)
		);
	}, [search, entries]);

	const activateEntry = useStable((id: string) => {
		setActiveEntry(id);
	});

	const openEditor = useStable((id: string) => {
		const entry = entries.find((entry) => entry.id === id);

		if (!entry) {
			return;
		}

		setIsEditing(true);
		setQueryName(entry.name);
		setQueryText(entry.query);
		setEditingId(id);
	});

	const deleteEntry = useStable(() => {
		setIsEditing(false);
		store.dispatch(removeFavoritesEntry(editingId));
	});

	const saveOrder = useStable((favorites: FavoritesEntry[]) => {
		store.dispatch(setFavorites(favorites));
	});

	const closeActive = useStable(() => {
		setActiveEntry("");
	});

	const historyList = useMemo(() => {
		if (filtered.length === 0) {
			return (
				<Text align="center" mt="sm">
					No results found
				</Text>
			);
		}

		return (
			<Sortable
				items={filtered}
				onSorting={closeActive}
				onSorted={saveOrder}
				constraint={{
					distance: 12,
				}}>
				{({ index, item, handleProps }) => (
					<Fragment key={index}>
						<FavoriteRow
							entry={item}
							isActive={activeEntry === item.id}
							isLight={isLight}
							activeSession={activeSession}
							enableDrag={!search}
							handleProps={handleProps}
							onActivate={activateEntry}
							onEdit={openEditor}
						/>
						{index !== filtered.length - 1 && <Divider color={isLight ? "light.0" : "dark.5"} />}
					</Fragment>
				)}
			</Sortable>
		);
	}, [activeEntry, activeSession, filtered, isLight]);

	return (
		<Panel
			title="Saved queries"
			icon={mdiStar}
			rightSection={<FavoritesActions onCreate={openSaveBox} />}>
			<ScrollArea
				style={{
					position: "absolute",
					inset: 12,
					top: 0,
				}}>
				<TextInput
					placeholder="Search queries..."
					icon={<Icon path={mdiMagnify} />}
					value={search}
					onChange={setSearch}
					mb="lg"
				/>

				<Stack spacing="sm">{historyList}</Stack>
			</ScrollArea>

			<Modal
				opened={isEditing}
				onClose={closeSaving}
				trapFocus={false}
				title={
					<ModalTitle>{editingId ? "Edit query" : "Save query"}</ModalTitle>
				}>
				<Form onSubmit={saveQuery}>
					<Stack>
						<TextInput placeholder="Enter query name" value={queryName} onChange={setQueryName} autoFocus />
						<Textarea placeholder="SELECT * FROM ..." value={queryText} onChange={setQueryText} minRows={8} />
						<Group>
							<Button color={isLight ? "light.5" : "light.3"} variant="light" onClick={closeSaving}>
								Close
							</Button>
							<Spacer />
							{editingId && (
								<Button color="red.6" variant="subtle" onClick={deleteEntry}>
									Delete
								</Button>
							)}
							<Button type="submit">Save</Button>
						</Group>
					</Stack>
				</Form>
			</Modal>
		</Panel>
	);
}

interface HistoryRowProps {
	isActive: boolean;
	entry: FavoritesEntry;
	isLight: boolean;
	activeSession: SurrealistSession | undefined;
	enableDrag: boolean;
	handleProps: Record<string, any>;
	onActivate: (id: string) => void;
	onEdit: (id: string) => void;
}

function FavoriteRow(props: HistoryRowProps) {
	const { isActive, entry, isLight, enableDrag, handleProps, onActivate, onEdit } = props;

	const theme = useMantineTheme();

	const editQuery = useStable(() => {
		onEdit(entry.id);
	});

	const executeFavorite = useStable(() => {
		store.dispatch(addQueryTab(entry.query));

		setTimeout(executeQuery, 0);
	});

	const handleClick = useStable((e: any) => {
		e.preventDefault();

		if (isActive) {
			onActivate("");
		} else {
			onActivate(entry.id);
		}
	});

	const openQuery = useStable(() => {
		store.dispatch(openTabCreator({
			name: entry.name.slice(0, 25),
			query: entry.query,
		}));
	});

	return (
		<Box
			color={isLight ? "light.0" : "dark.4"}
			className={classes.entry}
			style={{ borderColor: theme.fn.themeColor(isLight ? "light.0" : "dark.3") }}>
			<Group
				mb="sm"
				noWrap
				className={classes.entryHeader}
				onClick={handleClick}
				title="Drag to reorder"
				{...(enableDrag ? handleProps : {})}>
				<Text c="surreal" weight={500}>
					{entry.name}
				</Text>
				<Spacer />
				<Icon path={isActive ? mdiChevronDown : mdiChevronUp} style={{ flexShrink: 0 }} />
			</Group>

			<Collapse in={isActive}>
				<Paper withBorder p="xs">
					<Text
						ff="JetBrains Mono"
						c={isLight ? "black" : "white"}
						className={classes.queryText}
						lineClamp={8}
						weight={600}>
						{entry.query}
					</Text>
				</Paper>

				<SimpleGrid cols={3} mt="xs" pb="xs" spacing="xs">
					<Button size="xs" variant="light" color="violet" radius="sm" title="Edit query" onClick={editQuery}>
						<Icon path={mdiPencil} color="violet" />
					</Button>
					<Button size="xs" variant="light" color="pink" radius="sm" title="Run query" onClick={executeFavorite}>
						<Icon path={mdiPlay} color="pink" />
					</Button>
					<Button size="xs" variant="light" color="blue" radius="sm" title="Open in new session" onClick={openQuery}>
						<Icon path={mdiPlus} color="blue" />
					</Button>
				</SimpleGrid>
			</Collapse>
		</Box>
	);
}

interface FavoritesActionsProps {
	onCreate: () => void;
}

function FavoritesActions(props: FavoritesActionsProps) {
	const queryTab = useActiveQuery();
	const canSave = queryTab.text.length > 0;

	const hideFavorites = useStable(() => {
		store.dispatch(setShowQueryListing(false));
	});

	return (
		<Group align="center">
			{canSave && (
				<ActionIcon onClick={props.onCreate} title="Save current query">
					<Icon color="light.4" path={mdiPlus} />
				</ActionIcon>
			)}
			<ActionIcon onClick={hideFavorites} title="Hide favorites">
				<Icon color="light.4" path={mdiClose} />
			</ActionIcon>
		</Group>
	);
}
