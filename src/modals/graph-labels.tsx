import { Button, Combobox, Group, Paper, TagsInput, Text, useCombobox } from "@mantine/core";
import { Stack } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { openModal } from "@mantine/modals";
import { useMemo } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useConnection } from "~/hooks/connection";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { fuzzyMatch } from "~/util/helpers";
import { iconClose, iconPlus, iconSearch, iconTable } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";

export async function openGraphLabelEditorModal(callback: () => void) {
	await syncConnectionSchema();

	openModal({
		title: <PrimaryTitle fz={24}>Graph labels</PrimaryTitle>,
		withCloseButton: true,
		onClose: callback,
		children: <GraphLabelEditor />,
	});
}

function GraphLabelEditor() {
	const isLight = useIsLight();
	const { updateCurrentConnection } = useConfigStore.getState();
	const { tables } = useDatabaseSchema();
	const [search, setSearch] = useInputState("");
	const mapping = useConnection((c) => c?.graphLabels ?? {});

	const unmappedTables = useMemo(() => {
		return tables.filter(
			(table) => !(table.schema.name in mapping) && fuzzyMatch(search, table.schema.name),
		);
	}, [tables, mapping, search]);

	const mappedTables = useMemo(() => {
		return Object.entries(mapping)
			.map(([table, labels]) => {
				const schema = tables.find((t) => t.schema.name === table);
				const fields = schema?.fields?.map((f) => f.name) ?? [];

				return {
					table,
					labels,
					fields,
				};
			})
			.sort((a, b) => a.table.localeCompare(b.table));
	}, [mapping, tables]);

	const combobox = useCombobox({
		onDropdownClose: () => {
			combobox.resetSelectedOption();
			combobox.focusTarget();
			setSearch("");
		},
		onDropdownOpen: () => {
			combobox.focusSearchInput();
		},
	});

	const addLabelMapping = useStable((table: string) => {
		updateCurrentConnection({
			graphLabels: {
				...mapping,
				[table]: [],
			},
		});
	});

	const removeLabelMapping = useStable((table: string) => {
		const { [table]: _, ...rest } = mapping;

		updateCurrentConnection({
			graphLabels: rest,
		});
	});

	return (
		<>
			<Text>
				Specify one or more properties for each table to use as labels in the node graph.
				These properties are used for all queries in the active connection.
			</Text>
			<Stack mt="xl">
				{mappedTables.length === 0 ? (
					<Text c="slate">No label mappings defined yet</Text>
				) : (
					mappedTables.map(({ table, labels, fields }, i) => (
						<Paper
							key={i}
							p="md"
							bg={isLight ? "slate.0" : "slate.7"}
						>
							<Group>
								<Icon path={iconTable} />
								<Text
									flex={1}
									c="bright"
									fw={500}
									fz="lg"
									truncate
								>
									{table}
								</Text>
								<ActionButton
									label={"Close"}
									onClick={() => removeLabelMapping(table)}
								>
									<Icon path={iconClose} />
								</ActionButton>
							</Group>
							<TagsInput
								mt="md"
								placeholder="Enter property name..."
								value={labels}
								splitChars={[",", " ", "|"]}
								acceptValueOnBlur
								data={fields}
								onRemove={(value) => {
									updateCurrentConnection({
										graphLabels: {
											...mapping,
											[table]: labels.toSpliced(labels.indexOf(value), 1),
										},
									});
								}}
								onChange={(value) => {
									updateCurrentConnection({
										graphLabels: {
											...mapping,
											[table]: value,
										},
									});
								}}
							/>
						</Paper>
					))
				)}
			</Stack>
			<Combobox
				store={combobox}
				position="bottom-start"
				onOptionSubmit={(table) => {
					combobox.closeDropdown();
					addLabelMapping(table);
				}}
			>
				<Combobox.Target withAriaAttributes={false}>
					<Button
						mt="xl"
						size="xs"
						fullWidth
						variant="gradient"
						rightSection={<Icon path={iconPlus} />}
						onClick={() => combobox.toggleDropdown()}
					>
						Add label mapping
					</Button>
				</Combobox.Target>

				<Combobox.Dropdown>
					<Combobox.Search
						value={search}
						onChange={(event) => setSearch(event.currentTarget.value)}
						placeholder="Search tables"
						leftSection={<Icon path={iconSearch} />}
					/>
					<Combobox.Options>
						{unmappedTables.length === 0 ? (
							<Combobox.Empty>No tables found</Combobox.Empty>
						) : (
							unmappedTables.map((table) => (
								<Combobox.Option
									key={table.schema.name}
									value={table.schema.name}
								>
									{table.schema.name}
								</Combobox.Option>
							))
						)}
					</Combobox.Options>
				</Combobox.Dropdown>
			</Combobox>
		</>
	);
}
