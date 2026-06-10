import { Alert, Button, Center, Loader, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import type { Spectron } from "@surrealdb/spectron";
import { Icon, iconBroadcastOff, iconRefresh } from "@surrealdb/ui";
import type { ReactNode } from "react";
import { useSpectron } from "../provider";

export interface PageLoadingProps {
	message?: string;
	minHeight?: number;
}

/** Centered loading spinner used while a page's data is in flight. */
export function PageLoading({ message, minHeight = 280 }: PageLoadingProps) {
	return (
		<Center mih={minHeight}>
			<Stack
				align="center"
				gap="md"
			>
				<Loader />
				{message && (
					<Text
						c="slate"
						fz="sm"
					>
						{message}
					</Text>
				)}
			</Stack>
		</Center>
	);
}

export interface EmptyStateProps {
	icon: string;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
}

/** A bordered, centered placeholder for empty collections. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
	return (
		<Paper
			p={48}
			radius="md"
			withBorder
		>
			<Stack
				align="center"
				gap="sm"
				maw={420}
				mx="auto"
			>
				<ThemeIcon
					size={52}
					radius="xl"
					variant="light"
					color="violet"
				>
					<Icon
						path={icon}
						size="xl"
					/>
				</ThemeIcon>
				<Text
					fw={600}
					fz="lg"
					c="bright"
					ta="center"
				>
					{title}
				</Text>
				{description && (
					<Text
						c="slate"
						ta="center"
						className="selectable"
					>
						{description}
					</Text>
				)}
				{action}
			</Stack>
		</Paper>
	);
}

export interface PageErrorProps {
	title?: string;
	message?: ReactNode;
	onRetry?: () => void;
}

/** Inline error banner with an optional retry action. */
export function PageError({ title = "Something went wrong", message, onRetry }: PageErrorProps) {
	return (
		<Alert
			color="red"
			variant="light"
			title={title}
			icon={<Icon path={iconBroadcastOff} />}
		>
			<Stack gap="sm">
				{message && <Text className="selectable">{message}</Text>}
				{onRetry && (
					<Button
						size="xs"
						variant="light"
						color="red"
						leftSection={<Icon path={iconRefresh} />}
						onClick={onRetry}
						w="fit-content"
					>
						Try again
					</Button>
				)}
			</Stack>
		</Alert>
	);
}

export interface SpectronGateProps {
	/** Rendered with a guaranteed-ready client once the SDK has connected. */
	children: (client: Spectron) => ReactNode;
	loadingMessage?: string;
}

/**
 * Gates data-plane content on the Spectron SDK being connected. Renders a
 * loading state while the access token is minted and a retryable error state if
 * the connection fails, so individual pages never have to null-check the client.
 */
export function SpectronGate({ children, loadingMessage }: SpectronGateProps) {
	const { client, status, error, refresh } = useSpectron();

	if (status === "ready" && client) {
		return <>{children(client)}</>;
	}

	if (status === "error") {
		return (
			<PageError
				title="Couldn't connect to this context"
				message={
					error?.message ??
					"The access token for this context could not be issued. Check that you have a principal in this context, then try again."
				}
				onRetry={refresh}
			/>
		);
	}

	return <PageLoading message={loadingMessage ?? "Connecting to Spectron…"} />;
}
