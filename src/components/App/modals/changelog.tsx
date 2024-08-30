import classes from "../style.module.scss";
import dayjs from "dayjs";
import { Box, Divider, Modal, Stack, TypographyStylesProvider } from "@mantine/core";
import { useIntent } from "~/hooks/url";
import { changelogs } from "~/util/changelogs";
import { Text } from "@mantine/core";
import { Fragment } from "react";
import { useBoolean } from "~/hooks/boolean";
import { PrimaryTitle } from "~/components/PrimaryTitle";

export function ChangelogModal() {
	const [isOpen, openedHandle] = useBoolean();

	useIntent("open-changelog", openedHandle.open);

	return (
		<>
			<Modal
				opened={isOpen}
				onClose={openedHandle.close}
				trapFocus={false}
				withCloseButton
				size="xl"
				title={
					<PrimaryTitle>Release changelogs</PrimaryTitle>
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
								<TypographyStylesProvider
									dangerouslySetInnerHTML={{ __html: changelog.content }}
									className={classes.changelogContent}
								/>
							</Box>
							{index < changelogs.length - 1 && <Divider />}
						</Fragment>
					))}
				</Stack>
			</Modal>
		</>
	);
}
