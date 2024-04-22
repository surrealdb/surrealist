import { Box, Divider, Modal, Stack, TypographyStylesProvider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ModalTitle } from "../../ModalTitle";
import { useIntent } from "~/hooks/url";
import { changelogs } from "~/util/changelogs";
import { Text } from "@mantine/core";
import dayjs from "dayjs";
import { Fragment, useEffect } from "react";
import { useInterfaceStore } from "~/stores/interface";

export function ChangelogModal() {
	const { setShowChangelogAlert } = useInterfaceStore.getState();

	const [opened, openedHandle] = useDisclosure();

	useIntent("open-changelog", openedHandle.open);

	useEffect(() => {
		if (opened) {
			setShowChangelogAlert(false);
		}
	}, [opened]);

	return (
		<>
			<Modal
				opened={opened}
				onClose={openedHandle.close}
				trapFocus={false}
				withCloseButton
				size="xl"
				title={
					<ModalTitle>Surrealist Changelogs</ModalTitle>
				}
			>
				<Stack>
					{changelogs.map((changelog, index) => (
						<Fragment key={index}>
							<Box>
								<Text c="slate.3" fz="lg">
									{dayjs(changelog.metadata.date).format('YYYY-MM-DD')}
								</Text>
								<Text c="bright" fw={600} fz={20} mb="lg">
									{changelog.metadata.title}
								</Text>
								<TypographyStylesProvider dangerouslySetInnerHTML={{ __html: changelog.content }} />
							</Box>
							{index < changelogs.length - 1 && <Divider color="slate.7" />}
						</Fragment>
					))}
				</Stack>
			</Modal>
		</>
	);
}
