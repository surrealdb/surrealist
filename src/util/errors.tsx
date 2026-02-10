import { Box, Button, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { Icon } from "@surrealdb/ui";
import { ReactNode } from "react";
import { adapter } from "~/adapter";
import { CodePreview } from "~/components/CodePreview";
import { Spacer } from "~/components/Spacer";
import { iconBug, iconWarning } from "./icons";

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
	additionalInfo?: {
		title: string;
		content: string;
	}[],
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
					{additionalInfo && (
						<Stack gap="lg">
							{additionalInfo.map((info) => (
								<Box key={info.title}>
									<Title order={3}>{info.title}</Title>
									<CodePreview
										value={info.content}
										withCopy
									/>
								</Box>
							))}
						</Stack>
					)}

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
