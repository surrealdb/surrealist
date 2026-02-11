import { Anchor, Box, Group, Paper, Skeleton, Stack, Text, ThemeIcon } from "@mantine/core";
import { Icon, iconChevronRight, iconConsole, iconTransfer, iconXml } from "@surrealdb/ui";
import { openConnectCli } from "~/cloud/modals/connect-cli";
import { openConnectCurl } from "~/cloud/modals/connect-curl";
import { openConnectSdk } from "~/cloud/modals/connect-sdk";
import { useConnection } from "~/hooks/connection";
import { CloudInstance } from "~/types";
import classes from "./style.module.scss";

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
			<Anchor
				component="button"
				type="button"
				variant="glow"
				onClick={onClick}
				className={classes.action}
			>
				<Paper
					withBorder
					p="md"
				>
					<Group
						wrap="nowrap"
						h="100%"
						px="xs"
					>
						<ThemeIcon
							color="slate"
							variant="light"
							size={40}
						>
							<Icon path={icon} />
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
			</Anchor>
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
		<Stack gap="xl">
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
				onClick={() => instance && openConnectCurl(instance, namespace, database)}
			/>
		</Stack>
	);
}
