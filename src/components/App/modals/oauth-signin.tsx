import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { SurrealOAuthFlowError, useSurrealOAuthFlow } from "~/hooks/use-surreal-oauth-flow";
import { useInterfaceStore } from "~/stores/interface";
import { showErrorNotification } from "~/util/helpers";
import {
	cancelOAuthSignIn,
	completeOAuthSignIn,
	getPendingOAuthSignIn,
} from "~/util/oauth-signin-prompt";

export function OAuthSignInModal() {
	const opened = useInterfaceStore((s) => s.showOAuthSignIn);
	const { closeOAuthSignIn } = useInterfaceStore.getState();
	const { signIn: runOAuthSignIn, running } = useSurrealOAuthFlow();
	const [loading, loadingHandle] = useDisclosure();

	const pending = getPendingOAuthSignIn();
	const connectionName = pending?.connection.name || "this instance";

	const handleClose = useStable(() => {
		cancelOAuthSignIn();
		closeOAuthSignIn();
	});

	const handleAuthenticate = useStable(async () => {
		const request = getPendingOAuthSignIn();

		if (!request) {
			closeOAuthSignIn();
			return;
		}

		loadingHandle.open();

		try {
			const auth = await runOAuthSignIn(request.connection.authentication);

			completeOAuthSignIn(auth);
			closeOAuthSignIn();
		} catch (err: unknown) {
			const message =
				err instanceof SurrealOAuthFlowError
					? err.message
					: err instanceof Error
						? err.message
						: "OAuth sign-in failed";

			showErrorNotification({
				title: "OAuth sign-in failed",
				content: message,
			});
		} finally {
			loadingHandle.close();
		}
	});

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={<PrimaryTitle>Sign in required</PrimaryTitle>}
			size="md"
			centered
		>
			<Stack gap="lg">
				<Text>
					Authenticate with your identity provider to connect to{" "}
					<Text
						span
						fw={600}
					>
						{connectionName}
					</Text>
					. A browser window will open to complete sign-in.
				</Text>

				<Group justify="flex-end">
					<Button
						variant="light"
						onClick={handleClose}
						disabled={running || loading}
					>
						Cancel
					</Button>
					<Button
						variant="gradient"
						loading={running || loading}
						onClick={handleAuthenticate}
					>
						Continue
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
