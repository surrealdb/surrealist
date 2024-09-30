import {
	Box,
	Group,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { isDesktop } from "~/adapter";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Shortcut } from "~/components/Shortcut";
import { useBoolean } from "~/hooks/boolean";
import { useIsLight } from "~/hooks/theme";
import { useIntent } from "~/hooks/url";

interface KeyProps {
	keys: string;
	description: string;
}

function Key({ keys, description }: KeyProps) {
	return (
		<Group wrap="nowrap">
			<Box w={85}>
				<Shortcut value={keys} />
			</Box>
			<Text c="bright">{description}</Text>
		</Group>
	);
}

export function KeymapModal() {
	const [isOpen, openedHandle] = useBoolean();
	const isLight = useIsLight();

	useIntent("open-keymap", openedHandle.open);

	return (
		<>
			<Modal
				opened={isOpen}
				onClose={openedHandle.close}
				trapFocus={false}
				withCloseButton
				size="xl"
				title={<PrimaryTitle>Keyboard Shortcuts</PrimaryTitle>}
			>
				<Stack gap="xl">
					<Box>
						<Text fz="xl" fw="bold" mb="sm">
							Global shortcuts
						</Text>

						<Paper bg={isLight ? "slate.0" : "slate.9"} p="xl">
							<SimpleGrid cols={2}>
								<Key
									keys="mod k"
									description="Open the command palette"
								/>
								<Key
									keys="mod l"
									description="View the connections list"
								/>
								{isDesktop && (
									<Key
										keys="mod +"
										description="Increase application zoom"
									/>
								)}
								<Key
									keys="mod shift +"
									description="Increase editor zoom"
								/>
								{isDesktop && (
									<Key
										keys="mod -"
										description="Decrease application zoom"
									/>
								)}
								<Key
									keys="mod shift -"
									description="Decrease editor zoom"
								/>
								{isDesktop && (
									<Key
										keys="F10"
										description="Toggle window pinned"
									/>
								)}
								<Key
									keys="mod ,"
									description="Open the settings dialog"
								/>
							</SimpleGrid>
						</Paper>
					</Box>
					<Box>
						<Text fz="xl" fw="bold" mb="sm">
							Query view shortcuts
						</Text>

						<Paper bg={isLight ? "slate.0" : "slate.9"} p="xl">
							<SimpleGrid cols={2}>
								<Key
									keys="F9"
									description="Execute current query"
								/>
							</SimpleGrid>
						</Paper>
					</Box>
					<Box>
						<Text fz="xl" fw="bold" mb="sm">
							Editor shortcuts
						</Text>

						<Paper bg={isLight ? "slate.0" : "slate.9"} p="xl">
							<SimpleGrid cols={2}>
								<Key
									keys="mod f"
									description="Search for text occurrences"
								/>
								<Key
									keys="ctrl alt ["
									description="Fold everything"
								/>
								<Key
									keys="mod /"
									description="Toggle comment on selected lines"
								/>
								<Key
									keys="mod c"
									description="Copy selection"
								/>
								<Key keys="mod x" description="Cut selection" />
								<Key
									keys="mod v"
									description="Paste selection"
								/>
								<Key keys="mod z" description="Undo changes" />
								<Key keys="mod a" description="Select all" />
								<Key
									keys="mod shift z"
									description="Redo changes"
								/>
								<Key
									keys="LMB alt"
									description="Rectangular selection"
								/>
							</SimpleGrid>
						</Paper>
					</Box>
				</Stack>
			</Modal>
		</>
	);
}
