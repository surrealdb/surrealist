import { Alert, Group, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { iconEmail } from "~/util/icons";

export function openAccountSupport() {
	openModal({
		size: "lg",
		title: (
			<Group>
				<Icon
					path={iconEmail}
					size="xl"
				/>
				<PrimaryTitle>Account / Billing Support</PrimaryTitle>
			</Group>
		),
		withCloseButton: true,
		children: (
			<>
				<Text>
					For account or billing related issues, email{" "}
					<Link href="mailto:support@surrealdb.com">support@surrealdb.com</Link>.
				</Text>
				<Alert
					title="Important"
					color="orange"
					mt="xl"
				>
					Reach out using the email address associated with your Surreal Cloud account.
				</Alert>
			</>
		),
	});
}
