import { adapter } from "~/adapter";
import { useFeatureFlags } from "~/util/feature-flags";
import { CloudAccount } from "./account";
import { DatabaseServing } from "./serving";
import { HelpAndSupport } from "./support";
import { NewsFeed } from "./newsfeed";

export function ActionBar() {
	const [flags] = useFeatureFlags();

	return (
		<>
			{adapter.isServeSupported && <DatabaseServing />}

			{flags.newsfeed && <NewsFeed />}

			<HelpAndSupport />

			{flags.cloud_view && flags.cloud_access && <CloudAccount />}
		</>
	);
}
