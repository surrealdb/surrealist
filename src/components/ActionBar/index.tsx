import { Button } from "@mantine/core";
import { Icon, iconChevronRight } from "@surrealdb/ui";
import { adapter } from "~/adapter";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useIsDesktop } from "~/hooks/responsive";
import { useAuthentication } from "~/providers/Auth";
import { useFeatureFlags } from "~/util/feature-flags";
import { AccountMenu } from "./menu";
import { NewsFeed } from "./newsfeed";
import { DatabaseServing } from "./serving";
import { SidekickAction } from "./sidekick";

export function ActionBar() {
	const [flags] = useFeatureFlags();
	const showCloud = useIsCloudEnabled();
	const isDesktop = useIsDesktop();
	const { signIn, isAuthenticated, isLoading } = useAuthentication();

	const hasAccountMenu = showCloud && flags.cloud_access;

	return (
		<>
			{flags.sidekick_ai && <SidekickAction />}

			{adapter.isServeSupported && <DatabaseServing />}

			{flags.newsfeed && <NewsFeed />}

			{hasAccountMenu && <AccountMenu />}

			{!isAuthenticated && (isDesktop || !hasAccountMenu) && (
				<Button
					variant="gradient"
					size="xs"
					disabled={isLoading}
					onClick={() => signIn()}
					rightSection={<Icon path={iconChevronRight} />}
				>
					Sign in
				</Button>
			)}
		</>
	);
}
