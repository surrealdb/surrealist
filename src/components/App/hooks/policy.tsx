import { Box, Button } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useEffect } from "react";
import { Link } from "~/components/Link";
import { useOnboarding } from "~/hooks/onboarding";

export function usePolicyAlert() {
	const [completed, complete] = useOnboarding("policy");

	useEffect(() => {
		if (!completed) {
			showNotification({
				id: "policy",
				variant: "spaced",
				withCloseButton: false,
				autoClose: false,
				message: (
					<Box>
						<div>
							By clicking 'I agree' or continuing to use the site, you agree to our
							use of cookies to improve your browsing experience, analyse site
							performance, and for advertising. To learn more, including how to
							disable cookies, view our{" "}
							<Link href="https://surrealdb.com/legal/privacy">Privacy Policy</Link>{" "}
							and{" "}
							<Link href="https://surrealdb.com/legal/cookies">Cookies Policy</Link>.
						</div>
						<Button
							variant="gradient"
							size="xs"
							mt="md"
							onClick={complete}
							fullWidth
						>
							I agree
						</Button>
					</Box>
				),
			});
		}
	}, [completed]);
}
