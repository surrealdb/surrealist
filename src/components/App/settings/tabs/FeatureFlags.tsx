import { Group, ScrollArea, Select, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon, iconReset, iconSearch } from "@surrealdb/ui";
import { useMemo } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Spacer } from "~/components/Spacer";
import { featureFlags, schema, useFeatureFlags } from "~/util/feature-flags";
import { fuzzyMatch } from "~/util/helpers";

export function FeatureFlagsTab() {
	const [flags, setFlags] = useFeatureFlags();
	const flagNames = useMemo(() => Object.keys(flags) as (keyof typeof flags)[], [flags]);
	const defaults = featureFlags.initialStore;

	const [search, setSearch] = useInputState("");

	const filteredFlags = useMemo(() => {
		return flagNames.filter((flag) => fuzzyMatch(search, flag));
	}, [flagNames, search]);

	return (
		<ScrollArea
			pr="xl"
			flex={1}
			scrollbars="y"
			type="always"
		>
			<TextInput
				leftSection={
					<Icon
						path={iconSearch}
						size="sm"
					/>
				}
				autoFocus
				placeholder="Search preferences"
				value={search}
				onChange={setSearch}
				size="xs"
				mb="sm"
			/>
			<Stack
				mt="xl"
				pb={32}
			>
				{filteredFlags.length === 0 && (
					<Text
						ta="center"
						c="slate"
						mt="xl"
					>
						No flags matched your search
					</Text>
				)}
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
								<ActionButton
									variant="subtle"
									label="Reset to default"
									onClick={() => setFlags({ [flag]: defaults[flag] })}
								>
									<Icon path={iconReset} />
								</ActionButton>
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
	);
}
