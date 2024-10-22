import { Box, Divider, Group, Paper, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { PreferenceInput } from "~/components/Inputs/preference";
import { Spacer } from "~/components/Spacer";
import { fuzzyMatch } from "~/util/helpers";
import { iconSearch } from "~/util/icons";
import { PreferenceSection, computePreferences } from "~/util/preferences";

export function PreferencesTab() {
	const [search, setSearch] = useInputState("");

	const original = useMemo(() => {
		return computePreferences();
	}, []);

	const sections = useMemo(() => {
		return original.flatMap((section) => {
			const preferences = section.preferences.filter((preference) => {
				return (
					fuzzyMatch(search, preference.name) ||
					fuzzyMatch(search, preference.description)
				);
			});

			if (preferences.length === 0) {
				return [];
			}

			return [{ ...section, preferences }];
		});
	}, [original, search]);

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
				placeholder="Search preferences"
				value={search}
				onChange={setSearch}
				autoFocus
				size="xs"
				mb="sm"
			/>
			<Stack
				gap={52}
				mt="xl"
				pb={32}
			>
				{sections.length === 0 && (
					<Text
						ta="center"
						c="slate"
						mt="xl"
					>
						No preferences matched your search
					</Text>
				)}
				{sections.map((section, i) => (
					<Box key={i}>
						<Text
							fw={600}
							fz={20}
							c="bright"
						>
							{section.name}
						</Text>
						<Stack
							mt="lg"
							gap="lg"
						>
							{section.preferences.map((preference, j) => (
								<>
									<Group key={j}>
										<Box>
											<Text c="bright">{preference.name}</Text>
											{preference.description && (
												<Text
													fz="sm"
													c="slate"
												>
													{preference.description}
												</Text>
											)}
										</Box>
										<Spacer />
										<PreferenceInput controller={preference.controller} />
									</Group>
									{j < section.preferences.length - 1 && <Divider />}
								</>
							))}
						</Stack>
					</Box>
				))}
			</Stack>
		</ScrollArea>
	);
}
