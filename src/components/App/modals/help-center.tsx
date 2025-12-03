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
import clsx from "clsx";
import { navigate } from "wouter/use-browser-location";
import { useSearchHelpArticlesQuery } from "~/cloud/queries/context";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useBoolean } from "~/hooks/boolean";
import { useKeyNavigation } from "~/hooks/keys";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { IntercomSupportArticle } from "~/types";
import { Y_SLIDE_TRANSITION } from "~/util/helpers";
import { iconHelp } from "~/util/icons";
import classes from "../style.module.scss";

export function HelpSearchModal() {
	const [isOpen, openHandle] = useBoolean();
	const [search, setSearch] = useInputState("");

	const [searchQuery] = useDebouncedValue(search, 1000);

	const { data, isFetching } = useSearchHelpArticlesQuery(searchQuery);

	const openArticle = useStable((result: IntercomSupportArticle) => {
		openHandle.close();
		navigate(`/support/articles/${result.id}`);
	});

	const [handleKeyDown, selected] = useKeyNavigation(data ?? [], openArticle);

	useIntent("open-help-centre", ({ search }) => {
		openHandle.open();

		if (search) {
			setSearch(search);
		}
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
						path={iconHelp}
						size="sm"
					/>
					<Text>Help Centre</Text>
					{isFetching && (
						<Loader
							ml="sm"
							size={14}
						/>
					)}
				</Group>
				<TextInput
					flex={1}
					placeholder="Search the help centre..."
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
				className={classes.helpScroller}
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
						Enter a search term to find articles
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
						{data?.map((article) => (
							<Entry
								key={article.id}
								onClick={() => openArticle(article)}
								h="unset"
								ta="start"
								data-navigation-item-id={article.id}
								className={clsx(selected === article.id && classes.listingActive)}
							>
								<Box p={4}>
									{article.author && (
										<Text c="surreal">{article.author.name}</Text>
									)}
									<PrimaryTitle>{article.title}</PrimaryTitle>
									<Text
										style={{
											textWrap: "wrap",
											overflowWrap: "break-word",
										}}
									>
										{article.description}
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
