import classes from "../style.module.scss";

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
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { adapter } from "~/adapter";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useBoolean } from "~/hooks/boolean";
import { useKeyNavigation } from "~/hooks/keys";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/routing";
import { Y_SLIDE_TRANSITION } from "~/util/helpers";
import { iconBook } from "~/util/icons";

interface Result {
	id: string;
	url: string;
	title: string;
	content: string[];
	highlight: string;
	score: number;
	hostname: string;
}

export function DocumentationModal() {
	const [isOpen, openHandle] = useBoolean();
	const [search, setSearch] = useInputState("");

	const [searchQuery] = useDebouncedValue(search, 150);

	const { data, isFetching } = useQuery({
		queryKey: ["documentation", searchQuery],
		placeholderData: keepPreviousData,
		queryFn: async () => {
			if (!searchQuery) {
				return [];
			}

			const escaped = JSON.stringify(searchQuery);
			const hostname = JSON.stringify("main--surrealdb-docs.netlify.app");

			const query = /* surrealql */ `
				LET $query = ${escaped};
				LET $host = ${hostname};

				SELECT
					rand::guid() as id,
					path as url,
					hostname,
					title,
					content,
					search::highlight('<b>', '</b>', 7) AS highlight,
					(
						(search::score(0) * 10)
						+ (search::score(1) * 9)
						+ (search::score(2) * 7)
						+ (search::score(3) * 6)
						+ (search::score(4) * 5)
						+ (search::score(5) * 4)
						+ (search::score(6) * 2)
						+ search::score(7)
					) AS score
				FROM page
					WHERE
						hostname = $host
						AND (
							title @0@ $query
							OR path @1@ $query
							OR h1 @2@ $query
							OR h2 @3@ $query
							OR h3 @4@ $query
							OR h4 @5@ $query
							OR code @6@ $query
							OR content @7@ $query
						)
				ORDER BY score DESC LIMIT 10;
			`;

			const response = await fetch("https://blog-db.surrealdb.com/sql", {
				method: "POST",
				headers: {
					Accept: "application/json",
				},
				body: `USE NS docs DB search; ${query}`,
			});

			try {
				const results: any[] = await response.json();
				const answers = results[results.length - 1] ?? [];
				const links = answers.result as Result[];

				return links;
			} catch {
				return [];
			}
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
	});

	// useKeymap([["mod+j", () => dispatchIntent("open-documentation")]]);

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
						c="slate"
						my="xl"
					>
						Enter a search term to find documentation
					</Text>
				) : isEmpty ? (
					<Text
						ta="center"
						py="md"
						c="slate"
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
								data-navigation-item-id={doc.id}
								className={clsx(selected === doc.id && classes.listingActive)}
							>
								<Box>
									<PrimaryTitle>{doc.title}</PrimaryTitle>
									<Text c="surreal">{doc.url}</Text>
									<Text
										// biome-ignore lint/security/noDangerouslySetInnerHtml: temp, replace with markdown
										dangerouslySetInnerHTML={{ __html: doc.highlight[3] }}
										style={{
											textWrap: "wrap",
											overflowWrap: "break-word",
										}}
									/>
								</Box>
							</Entry>
						))}
					</Stack>
				)}
			</ScrollArea.Autosize>
		</Modal>
	);
}
