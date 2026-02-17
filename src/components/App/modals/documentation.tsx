import {
	Box,
	Divider,
	Group,
	Loader,
	Modal,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { Icon, iconBook } from "@surrealdb/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { adapter } from "~/adapter";
import { Entry } from "~/components/Entry";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useBoolean } from "~/hooks/boolean";
import { useKeyNavigation } from "~/hooks/keys";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { tagEvent } from "~/util/analytics";
import { Y_SLIDE_TRANSITION } from "~/util/helpers";
import classes from "../style.module.scss";

const ENDPOINT = "https://surrealdb.com/api/docs/search";

interface Result {
	id: string;
	url: string;
	title: string;
	description: string;
	score: number;
	hostname: string;
}

export function DocumentationModal() {
	const [isOpen, openHandle] = useBoolean();
	const [search, setSearch] = useInputState("");

	const [searchQuery] = useDebouncedValue(search, 300);
	const [trackedQuery] = useDebouncedValue(search, 1500);

	const { data, isFetching } = useQuery({
		queryKey: ["documentation", searchQuery],
		placeholderData: keepPreviousData,
		queryFn: async () => {
			if (!searchQuery) {
				return [];
			}

			const params = new URLSearchParams();

			params.append("hostname", "main--surrealdb-docs.netlify.app");
			params.append("query", searchQuery);

			const response = await fetch(`${ENDPOINT}?${params.toString()}`);
			const result: Result[] = await response.json();

			return result.map((doc) => ({ ...doc, id: doc.url }));
		},
	});

	useQuery({
		queryKey: ["documentation-track-query", searchQuery],
		placeholderData: keepPreviousData,
		queryFn: async () => {
			if (!trackedQuery) {
				return [];
			}

			tagEvent("documentation_search_query", { search: trackedQuery });
		},
	});

	const openDocumentation = useStable((doc: Result) => {
		openHandle.close();
		adapter.openUrl(`https://surrealdb.com${doc.url}`);
	});

	const [handleKeyDown, selected] = useKeyNavigation(data ?? [], openDocumentation);

	useIntent("open-documentation", ({ search }) => {
		openHandle.open();

		if (search) {
			setSearch(search);
		}

		tagEvent("documentation_search_open");
	});

	const isEmpty = data?.length === 0;

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			transitionProps={{ transition: Y_SLIDE_TRANSITION }}
			centered={false}
			size="lg"
			onKeyDown={handleKeyDown}
			classNames={{
				content: classes.listingModal,
				body: classes.listingBody,
			}}
		>
			<Box p="lg">
				<Group
					gap="xs"
					mb="sm"
					c="bright"
				>
					<Icon
						path={iconBook}
						size="sm"
					/>
					<Text>SurrealDB Documentation</Text>
					{isFetching && (
						<Loader
							ml="sm"
							size={14}
						/>
					)}
				</Group>
				<TextInput
					flex={1}
					placeholder="Search documentation..."
					variant="unstyled"
					className={classes.listingSearch}
					autoFocus
					value={search}
					spellCheck={false}
					onChange={setSearch}
				/>
			</Box>

			<Divider mx="lg" />

			<ScrollArea.Autosize
				className={classes.docsScroller}
				scrollbars="y"
				display="block"
				mah="calc(100vh - 225px)"
			>
				{isEmpty && !search ? (
					<Text
						ta="center"
						py="md"
						c="obsidian"
						my="xl"
					>
						Enter a search term to find documentation
					</Text>
				) : isEmpty ? (
					<Text
						ta="center"
						py="md"
						c="obsidian"
						my="xl"
					>
						No search results found
					</Text>
				) : (
					<Stack p="lg">
						{data?.map((doc) => (
							<Entry
								key={doc.url}
								onClick={() => openDocumentation(doc)}
								h="unset"
								ta="start"
								data-navigation-item-id={doc.url}
								className={clsx(selected === doc.url && classes.listingActive)}
							>
								<Box p={4}>
									<PrimaryTitle>{doc.title}</PrimaryTitle>
									<Text c="violet">{doc.url}</Text>
									<Text
										style={{
											textWrap: "wrap",
											overflowWrap: "break-word",
										}}
									>
										{doc.description}
									</Text>
								</Box>
							</Entry>
						))}
					</Stack>
				)}
			</ScrollArea.Autosize>
		</Modal>
	);
}
