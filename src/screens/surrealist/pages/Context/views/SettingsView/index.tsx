import {
	ActionIcon,
	Box,
	Button,
	Group,
	Paper,
	Stack,
	Switch,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Icon, iconDelete, iconPlus } from "@surrealdb/ui";
import { useState } from "react";
import { useCloudContextCategoriesQuery } from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { ContextViewProps } from "../../types";

export default function SettingsView({ context }: ContextViewProps) {
	const { data: categories } = useCloudContextCategoriesQuery(context.id);

	const [name, setName] = useState(context?.name ?? "");
	const [description, setDescription] = useState(context?.description ?? "");
	const [graphEnabled, setGraphEnabled] = useState(true);
	const [asyncMode, setAsyncMode] = useState(true);
	const [customCategories, setCustomCategories] = useState<
		{ name: string; description: string }[]
	>(
		categories?.map((c) => ({ name: c.name, description: c.description })) ?? [
			{
				name: "personal_details",
				description: "Personal information and biographical details",
			},
			{ name: "professional", description: "Work-related and career information" },
			{ name: "preferences", description: "User preferences and personal choices" },
			{ name: "technology", description: "Technology stack, tools and frameworks" },
			{ name: "food", description: "Food and beverage preferences" },
			{ name: "support", description: "Customer support interactions and resolutions" },
		],
	);

	const handleAddCategory = () => {
		setCustomCategories((prev) => [...prev, { name: "", description: "" }]);
	};

	const handleRemoveCategory = (index: number) => {
		setCustomCategories((prev) => prev.filter((_, i) => i !== index));
	};

	const handleCategoryChange = (index: number, field: "name" | "description", value: string) => {
		setCustomCategories((prev) =>
			prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
		);
	};

	const handleSave = () => {
		notifications.show({
			title: "Settings saved",
			message: "Your context settings have been updated.",
			color: "green",
		});
	};

	return (
		<>
			<PrimaryTitle fz={32}>Settings</PrimaryTitle>

			<Section title="General">
				<Stack gap="md">
					<TextInput
						label="Name"
						value={name}
						onChange={(e) => setName(e.currentTarget.value)}
					/>
					<Textarea
						label="Description"
						placeholder="Describe the purpose of this context..."
						value={description}
						onChange={(e) => setDescription(e.currentTarget.value)}
						minRows={3}
						autosize
					/>
					<TextInput
						label="Region"
						value={context?.region ?? ""}
						readOnly
						disabled
					/>
					<TextInput
						label="Version"
						value={context?.version ?? ""}
						readOnly
						disabled
					/>
				</Stack>
			</Section>

			<Section title="Memory options">
				<Stack gap="lg">
					<Switch
						label="Graph memory"
						description="Automatically build a knowledge graph from entities found in memories"
						checked={graphEnabled}
						onChange={(e) => setGraphEnabled(e.currentTarget.checked)}
					/>
					<Switch
						label="Async mode"
						description="Process memory operations asynchronously for better performance"
						checked={asyncMode}
						onChange={(e) => setAsyncMode(e.currentTarget.checked)}
					/>

					<Box>
						<Text
							fw={500}
							mb="xs"
						>
							Custom categories
						</Text>
						<Text mb="md">
							Define categories for automatic memory classification. Memories will be
							tagged using these labels.
						</Text>
						<Stack gap="xs">
							{customCategories.map((category, index) => (
								<Group
									key={index}
									gap="sm"
									wrap="nowrap"
								>
									<TextInput
										placeholder="Category name"
										value={category.name}
										onChange={(e) =>
											handleCategoryChange(
												index,
												"name",
												e.currentTarget.value,
											)
										}
										w={180}
									/>
									<TextInput
										placeholder="Description"
										value={category.description}
										onChange={(e) =>
											handleCategoryChange(
												index,
												"description",
												e.currentTarget.value,
											)
										}
										style={{ flex: 1 }}
									/>
									<ActionIcon
										variant="subtle"
										color="red"
										onClick={() => handleRemoveCategory(index)}
									>
										<Icon path={iconDelete} />
									</ActionIcon>
								</Group>
							))}
							<Button
								variant="subtle"
								size="xs"
								leftSection={<Icon path={iconPlus} />}
								onClick={handleAddCategory}
								w="fit-content"
							>
								Add category
							</Button>
						</Stack>
					</Box>
				</Stack>
			</Section>

			<Section title="Danger zone">
				<Paper
					p="lg"
					style={{
						borderColor: "var(--mantine-color-red-9)",
						borderWidth: 1,
						borderStyle: "solid",
					}}
				>
					<Stack gap="lg">
						<Group
							justify="space-between"
							align="flex-start"
						>
							<Box>
								<Text
									fw={500}
									c="bright"
								>
									Reset all memories
								</Text>
								<Text>
									Remove all memories from this context. This action cannot be
									undone.
								</Text>
							</Box>
							<Button
								variant="outline"
								color="red"
								size="xs"
								disabled
							>
								Reset memories
							</Button>
						</Group>
						<Group
							justify="space-between"
							align="flex-start"
						>
							<Box>
								<Text
									fw={500}
									c="bright"
								>
									Delete context
								</Text>
								<Text>
									Permanently delete this context and all associated data.
								</Text>
							</Box>
							<Button
								color="red"
								size="xs"
								disabled
							>
								Delete context
							</Button>
						</Group>
					</Stack>
				</Paper>
			</Section>

			<Group justify="flex-end">
				<Button onClick={handleSave}>Save changes</Button>
			</Group>
		</>
	);
}
