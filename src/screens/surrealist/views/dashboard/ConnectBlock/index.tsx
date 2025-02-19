import classes from "./style.module.scss";

import { Paper, Box, Group, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { useConnection } from "~/hooks/connection";
import { openConnectCli } from "~/screens/surrealist/cloud-panel/modals/connect-cli";
import { openConnectCurl } from "~/screens/surrealist/cloud-panel/modals/connect-curl";
import { openConnectSdk } from "~/screens/surrealist/cloud-panel/modals/connect-sdk";
import { CloudInstance } from "~/types";
import { iconAPI, iconChevronRight, iconConsole } from "~/util/icons";

interface ConnectActionProps {
	title: string;
	subtitle: string;
	icon: string;
	onClick?: () => void;
}

function ConnectAction({ title, subtitle, icon, onClick }: ConnectActionProps) {
	return (
		<UnstyledButton onClick={onClick}>
			<Paper
				h="100%"
				className={classes.action}
			>
				<Group
					wrap="nowrap"
					h="100%"
					px="md"
				>
					<ThemeIcon
						color="slate"
						size="xl"
					>
						<Icon
							path={icon}
							size="xl"
						/>
					</ThemeIcon>
					<Box flex={1}>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							{title}
						</Text>
						<Text>{subtitle}</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						ml="md"
					/>
				</Group>
			</Paper>
		</UnstyledButton>
	);
}

export interface ConnectBlockProps {
	instance: CloudInstance | undefined;
}

export function ConnectBlock({ instance }: ConnectBlockProps) {
	const [namespace, database] = useConnection((c) => [
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
	]);

	return (
		<Box
			style={{
				display: "grid",
				gap: "var(--mantine-spacing-xl)",
			}}
		>
			<ConnectAction
				title="Connect with Surreal CLI"
				subtitle="For commandline environments"
				icon={iconConsole}
				onClick={() => instance && openConnectCli(instance)}
			/>
			<ConnectAction
				title="Connect with an SDK"
				subtitle="For integrating SurrealDB"
				icon={iconAPI}
				onClick={() => instance && openConnectSdk(instance, namespace, database)}
			/>
			<ConnectAction
				title="Connect with HTTP cURL"
				subtitle="For HTTP only environments"
				icon={iconConsole}
				onClick={() => instance && openConnectCurl(instance)}
			/>
		</Box>
	);
}
