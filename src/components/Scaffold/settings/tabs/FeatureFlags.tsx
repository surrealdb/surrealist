import { ActionIcon, Group, Select, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { featureFlags, schema, useFeatureFlags } from "~/util/feature-flags";
import { iconReset } from "~/util/icons";

export function FeatureFlagsTab() {
	const [flags, setFlags] = useFeatureFlags();
	const flagNames = useMemo(
		() => Object.keys(flags) as (keyof typeof flags)[],
		[flags],
	);
	const defaults = featureFlags.initialStore;

	return (
		<Stack gap="xs" style={{ overflow: "hidden" }}>
			{flagNames.map((flag) => {
				const mapped = Object.fromEntries(
					schema[flag].options.map((v) => [v.toString(), v]),
				);
				const data = schema[flag].options.map((value) => value.toString());

				return (
					<Group key={flag} gap="xs">
						<Text fw={600} c="bright">
							{flag}
						</Text>
						<Text c="slate">({typeof flags[flag]})</Text>
						<Spacer />
						{defaults[flag] !== flags[flag] && (
							<ActionIcon
								variant="subtle"
								onClick={() => setFlags({ [flag]: defaults[flag] })}
								aria-label="Reset to default value"
							>
								<Icon path={iconReset} />
							</ActionIcon>
						)}
						<Select
							data={data}
							value={flags[flag].toString()}
							onChange={(val) =>
								setFlags({ [flag]: val ? mapped[val] : defaults[flag] })
							}
							size="xs"
						/>
					</Group>
				);
			})}
		</Stack>
	);
}
