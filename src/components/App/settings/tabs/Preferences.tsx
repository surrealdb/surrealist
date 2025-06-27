import { Box, Divider, Flex, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Fragment, useMemo } from "react";
import { Icon } from "~/components/Icon";
import { PreferenceInput } from "~/components/Inputs/preference";
import { Spacer } from "~/components/Spacer";
import { fuzzyMatch } from "~/util/helpers";
import { iconSearch } from "~/util/icons";
import { FlagSetController, Preference, useComputedPreferences } from "~/util/preferences";

function isTallInput(preference: Preference) {
	return preference.controller instanceof FlagSetController;
}

export function PreferencesTab() {
	const [search, setSearch] = useInputState("");

	const original = useComputedPreferences();

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
					<Box
						key={i}
						id={section.id}
					>
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
							{section.preferences.map((preference, j) => {
								const isTall = isTallInput(preference);

								return (
									<Fragment key={j}>
										<Flex
											id={preference.id}
											align={isTall ? "strech" : "center"}
											direction={isTall ? "column" : "row"}
											w="100%"
										>
											<Box>
												<Text
													c="bright"
													fw={500}
												>
													{preference.name}
												</Text>
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
											<PreferenceInput
												controller={preference.controller}
												mt={isTall ? "lg" : undefined}
											/>
										</Flex>
										{j < section.preferences.length - 1 && <Divider />}
									</Fragment>
								);
							})}
						</Stack>
					</Box>
				))}
			</Stack>
		</ScrollArea>
	);
}
