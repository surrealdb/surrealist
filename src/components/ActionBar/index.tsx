import { Button } from "@mantine/core";
import { Icon, iconChevronRight } from "@surrealdb/ui";
import { adapter } from "~/adapter";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import { useFeatureFlags } from "~/util/feature-flags";
import { AccountMenu } from "./menu";
import { NewsFeed } from "./newsfeed";
import { DatabaseServing } from "./serving";
import { SidekickAction } from "./sidekick";

export function ActionBar() {
	const [flags] = useFeatureFlags();
	const showCloud = useIsCloudEnabled();
	const { signIn, isAuthenticated, isLoading } = useAuthentication();

	return (
		<>
			{flags.sidekick_ai && <SidekickAction />}

			{adapter.isServeSupported && <DatabaseServing />}

			{flags.newsfeed && <NewsFeed />}

			{showCloud && flags.cloud_access && <AccountMenu />}

			{!isAuthenticated && (
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
