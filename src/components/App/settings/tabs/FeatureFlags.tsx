import { ActionIcon, Group, ScrollArea, Select, Stack, TextInput } from "@mantine/core";
import { Text } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { featureFlags, schema, useFeatureFlags } from "~/util/feature-flags";
import { fuzzyMatch } from "~/util/helpers";
import { iconReset, iconSearch } from "~/util/icons";

export function FeatureFlagsTab() {
	const [flags, setFlags] = useFeatureFlags();
	const flagNames = useMemo(() => Object.keys(flags) as (keyof typeof flags)[], [flags]);
	const defaults = featureFlags.initialStore;

	const [search, setSearch] = useInputState("");

	const filteredFlags = useMemo(() => {
		return flagNames.filter((flag) => fuzzyMatch(search, flag));
	}, [flagNames, search]);

	return (
		<>
			<TextInput
				leftSection={
					<Icon
						path={iconSearch}
						size="sm"
					/>
				}
				placeholder="Filter feature flags"
				variant="unstyled"
				value={search}
				onChange={setSearch}
				autoFocus
				size="xs"
				w="100%"
				mb="sm"
			/>

			<ScrollArea
				mt="md"
				flex={1}
				scrollbars="xy"
				type="always"
				bottom="var(--mantine-spacing-xl)"
			>
				<Stack
					gap="xs"
					style={{ overflow: "hidden" }}
				>
					{filteredFlags.map((flag) => {
						const mapped = Object.fromEntries(
							schema[flag].options.map((v) => [v.toString(), v]),
						);
						const data = schema[flag].options.map((value) => value.toString());

						return (
							<Group
								key={flag}
								gap="xs"
							>
								<Text
									fw={600}
									c="bright"
								>
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
										setFlags({
											[flag]: val ? mapped[val] : defaults[flag],
										})
									}
									size="xs"
								/>
							</Group>
						);
					})}
				</Stack>
			</ScrollArea>
		</>
	);
}
