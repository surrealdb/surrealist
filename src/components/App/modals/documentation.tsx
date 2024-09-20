import classes from "../style.module.scss";

import {
	Box,
	Divider,
	Group,
	Modal,
	ScrollArea,
	Text,
	TextInput,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { Icon } from "~/components/Icon";
import { useBoolean } from "~/hooks/boolean";
import { useKeymap } from "~/hooks/keymap";
import { useIntent } from "~/hooks/url";
import { Y_SLIDE_TRANSITION } from "~/util/helpers";
import { iconBook } from "~/util/icons";

export function DocumentationModal() {
	const [isOpen, openHandle] = useBoolean();
	const [search, setSearch] = useInputState("");

	useIntent("open-documentation", openHandle.open);

	useKeymap([
		[
			"mod+j",
			() => {
				openHandle.open();
			},
		],
	]);

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
				scrollbars="y"
				mah={350}
				mih={64}
			>
				<Text
					ta="center"
					py="md"
					c="slate"
				>
					Enter a search term to find documentation
				</Text>
			</ScrollArea.Autosize>
		</Modal>
	);
}
