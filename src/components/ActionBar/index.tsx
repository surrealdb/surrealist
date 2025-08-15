import { adapter } from "~/adapter";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useFeatureFlags } from "~/util/feature-flags";
import { CloudAccount } from "./account";
import { NewsFeed } from "./newsfeed";
import { DatabaseServing } from "./serving";
import { SidekickAction } from "./sidekick";
import { HelpAndSupport } from "./support";

export function ActionBar() {
	const [flags] = useFeatureFlags();
	const showCloud = useIsCloudEnabled();

	return (
		<>
			{flags.sidekick_ai && <SidekickAction />}

			{adapter.isServeSupported && <DatabaseServing />}

			{flags.newsfeed && <NewsFeed />}

			<HelpAndSupport />

			{showCloud && flags.cloud_access && <CloudAccount />}
		</>
	);
}
