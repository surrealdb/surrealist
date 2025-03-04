import classes from "./style.module.scss";

import { Box, Group, Paper, Skeleton, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { openConnectCli } from "~/cloud/modals/connect-cli";
import { openConnectCurl } from "~/cloud/modals/connect-curl";
import { openConnectSdk } from "~/cloud/modals/connect-sdk";
import { Icon } from "~/components/Icon";
import { useConnection } from "~/hooks/connection";
import { CloudInstance } from "~/types";
import { iconAPI, iconChevronRight, iconConsole, iconTransfer, iconXml } from "~/util/icons";

interface ConnectActionProps {
	title: string;
	subtitle: string;
	icon: string;
	isLoading: boolean;
	onClick?: () => void;
}

function ConnectAction({ title, subtitle, icon, isLoading, onClick }: ConnectActionProps) {
	return (
		<Skeleton
			visible={isLoading}
			display="grid"
		>
			<Paper
				className={classes.action}
				onClick={onClick}
				component="button"
				type="button"
			>
				<Group
					wrap="nowrap"
					h="100%"
					px="xs"
				>
					<ThemeIcon
						color="slate"
						size={40}
					>
						<Icon
							path={icon}
							size="lg"
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
		</Skeleton>
	);
}

export interface ConnectBlockProps {
	instance: CloudInstance | undefined;
	isLoading: boolean;
}

export function ConnectBlock({ instance, isLoading }: ConnectBlockProps) {
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
				isLoading={isLoading}
				onClick={() => instance && openConnectCli(instance)}
			/>
			<ConnectAction
				title="Connect with an SDK"
				subtitle="For integrating SurrealDB"
				icon={iconXml}
				isLoading={isLoading}
				onClick={() => instance && openConnectSdk(instance, namespace, database)}
			/>
			<ConnectAction
				title="Connect with HTTP cURL"
				subtitle="For HTTP only environments"
				icon={iconTransfer}
				isLoading={isLoading}
				onClick={() => instance && openConnectCurl(instance)}
			/>
		</Box>
	);
}
