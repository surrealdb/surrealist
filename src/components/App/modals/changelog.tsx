import {
	Box,
	Divider,
	Modal,
	Stack,
	TypographyStylesProvider,
} from "@mantine/core";
import { Text } from "@mantine/core";
import dayjs from "dayjs";
import { Fragment } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useBoolean } from "~/hooks/boolean";
import { useIntent } from "~/hooks/url";
import { changelogs } from "~/util/changelogs";
import classes from "../style.module.scss";

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
				title={<PrimaryTitle>Release changelogs</PrimaryTitle>}
			>
				<Stack>
					{changelogs.map((changelog, index) => (
						<Fragment key={index}>
							<Box>
								<Text c="slate.3" fz="lg">
									{dayjs(changelog.metadata.date).format(
										"YYYY-MM-DD",
									)}
								</Text>
								<Text c="bright" fw={600} fz={20} mb="lg">
									{changelog.metadata.title}
								</Text>
								<TypographyStylesProvider
									// biome-ignore lint/security/noDangerouslySetInnerHtml: Replace with markdown
									dangerouslySetInnerHTML={{
										__html: changelog.content,
									}}
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
