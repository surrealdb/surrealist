import { Box, Button, Divider, Group, Stack, Title } from "@mantine/core";
import { Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { ReactNode } from "react";
import { adapter } from "~/adapter";
import { CodePreview } from "~/components/CodePreview";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { iconBug, iconCheck, iconCursor, iconWarning } from "./icons";

/**
 * Thrown during a failure in a cloud operation.
 */
export class CloudError extends Error {}

/**
 * Opens a modal displaying an error message with optional details.
 *
 * @param title - The title of the error modal.
 * @param message - An optional message describing the error.
 * @param cause - An optional cause of the error.
 * @param trace - An optional stack trace for debugging purposes.
 */
export async function openErrorModal(
	title: ReactNode | string,
	message?: string,
	cause?: string,
	trace?: string,
) {
	return new Promise<void>((resolve) => {
		openModal({
			modalId: "error",
			size: "xl",
			onClose: resolve,
			withCloseButton: true,
			closeButtonProps: {
				size: "lg",
			},
			title: (
				<Group c="bright">
					<Icon
						path={iconWarning}
						size="lg"
					/>
					<Title>{title}</Title>
				</Group>
			),
			children: (
				<Stack gap="lg">
					{message && (
						<Box>
							<Title order={3}>Message</Title>

							<CodePreview
								value={message}
								withCopy
							/>
						</Box>
					)}
					{cause && (
						<Box>
							<Title order={3}>Cause</Title>

							<CodePreview
								value={cause}
								withCopy
							/>
						</Box>
					)}

					{trace && (
						<Box>
							<Title order={3}>Stack trace</Title>

							<CodePreview
								value={trace}
								withCopy
							/>
						</Box>
					)}

					<Divider />

					<Group>
						<Text>
							If you believe this is a bug, please report it on our GitHub repository.
						</Text>

						<Spacer />

						<Button
							leftSection={<Icon path={iconBug} />}
							onClick={() =>
								adapter.openUrl("https://github.com/surrealdb/surrealist/issues")
							}
							variant="light"
							color="slate"
							radius="xs"
							size="xs"
						>
							File an issue
						</Button>
					</Group>
				</Stack>
			),
		});
	});
}
