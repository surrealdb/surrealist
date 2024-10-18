import { Box, Divider, Group, Paper, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { PreferenceInput } from "~/components/Inputs/preference";
import { Spacer } from "~/components/Spacer";
import { iconSearch } from "~/util/icons";
import { computePreferences } from "~/util/preferences";

export function PreferencesTab() {
	const [search, setSearch] = useInputState("");

	const sections = useMemo(() => {
		return computePreferences();
	}, []);

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
				size="xs"
				mb="sm"
			/>
			<Stack
				gap={52}
				mt="xl"
				pb={32}
			>
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
