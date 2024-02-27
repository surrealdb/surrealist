import { Stack, Select } from "@mantine/core";
import { featureFlagSchema, useFeatureFlags } from "~/util/feature-flags";
import { useMemo } from "react";

const generateKey = (v: string | number | boolean) => `${typeof v}:${v.toString()}`;

export function FeatureFlagsTab() {
	const [flags, setFlags] = useFeatureFlags();
	const flagNames = useMemo(() => Object.keys(flags) as (keyof typeof flags)[], [flags]);

	return (
		<Stack gap="xs" style={{ overflow: 'hidden' }}>
			{flagNames.map((flag) => {
				const def = featureFlagSchema[flag].options[0];
				const mapped = Object.fromEntries(featureFlagSchema[flag].options.map(v => [generateKey(v), v]));
				const data = featureFlagSchema[flag].options.map((value) => ({
					label: `${typeof value}: ${value.toString()}`,
					value: generateKey(value),
				}));

				return (
					<Select
						key={flag}
						label={flag}
						data={data}
						value={generateKey(flags[flag])}
						onChange={(k) => setFlags({ [flag]: k ? mapped[k] : def })}
					/>
				);
			})}
		</Stack>
	);
}
