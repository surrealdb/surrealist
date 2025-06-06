import { FeatureFlagProvider } from "@theopensource-company/feature-flags/react";
import { type PropsWithChildren, useEffect } from "react";
import { useConfigStore } from "~/stores/config";
import { featureFlags } from "~/util/feature-flags";
import { createLock } from "~/util/lock";

const { lock: featureFlagsLock, Resolve } = createLock();
export { featureFlagsLock };

export function FeatureFlagsProvider({ children }: PropsWithChildren) {
	const fromConfig = useConfigStore((s) => s.featureFlags);
	const setFeatureFlag = useConfigStore((s) => s.setFeatureFlag);

	useEffect(() => {
		featureFlags.subscribe(setFeatureFlag);

		return () => {
			featureFlags.unsubscribe(setFeatureFlag);
		};
	}, [setFeatureFlag]);

	return (
		<FeatureFlagProvider
			featureFlags={featureFlags}
			hydratedOverrides={(flag) => fromConfig[flag]}
		>
			<Resolve />
			{children}
		</FeatureFlagProvider>
	);
}
