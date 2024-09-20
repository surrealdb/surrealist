import classes from "../style.module.scss";

import {
	Box,
	Divider,
	Group,
	Loader,
	Modal,
	Progress,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { sleep } from "radash";
import { adapter } from "~/adapter";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useBoolean } from "~/hooks/boolean";
import { useKeymap } from "~/hooks/keymap";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { Y_SLIDE_TRANSITION } from "~/util/helpers";
import { iconBook } from "~/util/icons";

interface Offset {
	e: number;
	s: number;
}

interface Result {
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
	const client = useQueryClient();

	const [searchQuery] = useDebouncedValue(search, 150);

	const { data, isFetching } = useQuery({
		queryKey: ["documentation", searchQuery],
		enabled: searchQuery.length > 0,
		placeholderData: keepPreviousData,
		queryFn: async () => {
			const escaped = JSON.stringify(searchQuery);
			const hostname = JSON.stringify("main--surrealdb-docs.netlify.app");

			const query = /* surrealql */ `
				LET $query = ${escaped};
				LET $host = ${hostname};

				SELECT
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

	const openDocumentation = (doc: Result) => {
		openHandle.close();
		adapter.openUrl(`https://surrealdb.com${doc.url}`);
	};

	useIntent("open-documentation", () => {
		openHandle.open();
	});

	useKeymap([["mod+j", () => dispatchIntent("open-documentation")]]);

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			transitionProps={{ transition: Y_SLIDE_TRANSITION }}
			centered={false}
			size="lg"
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
				mah={350}
				mih={64}
			>
				{!data ? (
					<Text
						ta="center"
						py="md"
						c="slate"
					>
						Enter a search term to find documentation
					</Text>
				) : data.length === 0 ? (
					<Text
						ta="center"
						py="md"
						c="slate"
					>
						No search results found
					</Text>
				) : (
					<Stack p="lg">
						{data.map((doc) => (
							<Entry
								key={doc.url}
								onClick={() => openDocumentation(doc)}
								h="unset"
								ta="start"
							>
								<Box>
									<PrimaryTitle>{doc.title}</PrimaryTitle>
									<Text c="surreal">{doc.url}</Text>
									<Text
										// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
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
