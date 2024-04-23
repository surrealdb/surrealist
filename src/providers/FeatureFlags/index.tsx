import { FeatureFlagProvider } from '@theopensource-company/feature-flags/react';
import { PropsWithChildren, useEffect } from 'react';
import { useConfigStore } from '~/stores/config';
import { featureFlags } from '~/util/feature-flags';

export function FeatureFlagsProvider({ children }: PropsWithChildren) {
	const fromConfig = useConfigStore((s) => s.featureFlags);
	const setFeatureFlag = useConfigStore((s) => s.setFeatureFlag);

	useEffect(() => {
		featureFlags.subscribe(setFeatureFlag);

		return () => {
			featureFlags.unsubscribe(setFeatureFlag);
		};
	}, [featureFlags, setFeatureFlag]);

	return (
		<FeatureFlagProvider
			featureFlags={featureFlags}
			hydratedOverrides={(flag) => fromConfig[flag]}
		>
			{children}
		</FeatureFlagProvider>
	);
}