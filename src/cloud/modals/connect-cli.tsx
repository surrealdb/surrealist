import { Group, Skeleton, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { useEffect } from "react";
import { CodePreview } from "~/components/CodePreview";
import { Icon } from "~/components/Icon";
import { LearnMore } from "~/components/LearnMore";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import type { CloudInstance } from "~/types";
import { iconConsole } from "~/util/icons";
import { useCloudAuthTokenMutation } from "../mutations/auth";

export function openConnectCli(instance: CloudInstance) {
	openModal({
		size: "lg",
		title: (
			<Group>
				<Icon
					path={iconConsole}
					size="xl"
				/>
				<PrimaryTitle>Connect with the CLI</PrimaryTitle>
			</Group>
		),
		withCloseButton: true,
		children: <ConnectCliModal instance={instance} />,
	});
}

interface ConnectCliModalProps {
	instance: CloudInstance;
}

function ConnectCliModal({ instance }: ConnectCliModalProps) {
	const { data, mutateAsync, isPending } = useCloudAuthTokenMutation(instance.id);

	const endpoint = `wss://${instance.host}`;
	const command = `surreal sql --endpoint ${endpoint} --token ${data}`;

	// biome-ignore lint/correctness/useExhaustiveDependencies: only trigger on mount
	useEffect(() => {
		mutateAsync();
	}, []);

	return (
		<>
			<Text size="lg">
				In order to connect to this instance, make sure you have the{" "}
				<Link href="https://surrealdb.com/docs/surrealdb/cli">SurrealDB CLI</Link>{" "}
				installed. Once it is installed, simply open the terminal of your choice and run the
				following command to connect to your Surreal Cloud instance.
			</Text>

			<Skeleton
				mt="xl"
				visible={isPending}
			>
				<CodePreview
					language="bash"
					value={command}
					withCopy
				/>
			</Skeleton>

			<LearnMore
				mt="xl"
				href="https://surrealdb.com/docs/surrealdb/cli"
				display="block"
			>
				Learn more about the SurrealDB CLI
			</LearnMore>
		</>
	);
}
