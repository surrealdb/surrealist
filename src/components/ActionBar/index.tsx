import { NewsFeed } from "./newsfeed";
import { HelpAndSupport } from "./support";
import { useFeatureFlags } from "~/util/feature-flags";
import { adapter } from "~/adapter";
import { DatabaseServing } from "./serving";
import { CloudAccount } from "./account";

export function ActionBar() {
	const [flags] = useFeatureFlags();

	return (
		<>
			{adapter.isServeSupported && (
				<DatabaseServing />
			)}

			{flags.newsfeed && (
				<NewsFeed />
			)}

			<HelpAndSupport />

			{flags.cloud_view && flags.cloud_access && (
				<CloudAccount />
			)}
		</>
	);
}