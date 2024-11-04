import { Box, Divider, Group, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Fragment, useMemo } from "react";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { computeCommands } from "~/util/commands";
import { fuzzyMatch } from "~/util/helpers";
import { iconSearch } from "~/util/icons";

export function KeybindingsTab() {
	const [search, setSearch] = useInputState("");

	const original = useMemo(() => {
		return computeCommands();
	}, []);

	const categories = useMemo(() => {
		return original.flatMap((category) => {
			const commands = category.commands.filter((cmd) => {
				return (
					cmd.bindable &&
					(fuzzyMatch(search, cmd.name) ||
						cmd.aliases?.some((alias) => fuzzyMatch(search, alias)))
				);
			});

			if (commands.length === 0) {
				return [];
			}

			return [{ ...category, commands }];
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
				gap="xl"
				mt="xl"
				pb={32}
			>
				{categories.length === 0 && (
					<Text
						ta="center"
						c="slate"
						mt="xl"
					>
						No results matched your search
					</Text>
				)}
				{categories.map((category, i) => (
					<Box key={i}>
						<Text
							fw={600}
							fz={20}
							c="bright"
						>
							{category.name}
						</Text>
						<Stack
							mt="lg"
							gap="xs"
						>
							{category.commands.map((cmd, j) => (
								<Fragment key={j}>
									<Group>
										<Text c="bright">{cmd.name}</Text>
										<Spacer />
										<TextInput />
									</Group>
									{j < category.commands.length - 1 && <Divider />}
								</Fragment>
							))}
						</Stack>
					</Box>
				))}
			</Stack>
		</ScrollArea>
	);
}
