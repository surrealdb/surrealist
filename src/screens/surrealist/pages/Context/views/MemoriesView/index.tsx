import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Center,
	Chip,
	Drawer,
	Group,
	MultiSelect,
	Paper,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { Icon, iconChat, iconDelete, iconEdit, iconSearch } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import {
	useCloudContextCategoriesQuery,
	useCloudContextEntitiesQuery,
	useCloudContextMemoriesQuery,
} from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import type { ContextMemory } from "~/types";
import { ContextViewProps } from "../../types";

const CATEGORY_COLORS: Record<string, string> = {
	preferences: "blue",
	technology: "orange",
	professional: "violet",
	food: "green",
	personal_details: "cyan",
	support: "red",
};

const SORT_OPTIONS = [
	{ label: "Newest first", value: "newest" },
	{ label: "Oldest first", value: "oldest" },
	{ label: "Highest score", value: "score" },
];

function formatRelativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diff / 60_000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function MemoryCard({
	memory,
	onEdit,
	onDelete,
}: {
	memory: ContextMemory;
	onEdit: (memory: ContextMemory) => void;
	onDelete: (memory: ContextMemory) => void;
}) {
	return (
		<Paper p="md">
			<Stack gap="sm">
				<Group
					justify="space-between"
					align="flex-start"
					wrap="nowrap"
				>
					<Text
						fw={600}
						c="bright"
						style={{ flex: 1 }}
					>
						{memory.text}
					</Text>
					<Group gap={4}>
						{memory.immutable && (
							<Badge
								variant="outline"
								size="xs"
								color="gray"
							>
								Immutable
							</Badge>
						)}
						<ActionIcon
							variant="subtle"
							size="sm"
							onClick={() => onEdit(memory)}
							disabled={memory.immutable}
						>
							<Icon path={iconEdit} />
						</ActionIcon>
						<ActionIcon
							variant="subtle"
							size="sm"
							color="red"
							onClick={() => onDelete(memory)}
							disabled={memory.immutable}
						>
							<Icon path={iconDelete} />
						</ActionIcon>
					</Group>
				</Group>

				<Group gap="xs">
					{memory.categories.map((cat) => (
						<Badge
							key={cat}
							variant="light"
							size="xs"
							color={CATEGORY_COLORS[cat] ?? "gray"}
						>
							{cat}
						</Badge>
					))}
				</Group>

				{Object.keys(memory.metadata).length > 0 && (
					<Group gap="xs">
						{Object.entries(memory.metadata).map(([key, value]) => (
							<Badge
								key={key}
								variant="dot"
								size="xs"
							>
								{key}: {value}
							</Badge>
						))}
					</Group>
				)}

				<Group justify="space-between">
					<Group gap="md">
						<Text
							size="xs"
							c="dimmed"
						>
							{memory.userId}
						</Text>
						<Text
							size="xs"
							c="dimmed"
						>
							Score: {memory.score.toFixed(2)}
						</Text>
					</Group>
					<Group gap="md">
						<Text
							size="xs"
							c="dimmed"
						>
							Created {formatRelativeTime(memory.createdAt)}
						</Text>
						{memory.createdAt !== memory.updatedAt && (
							<Text
								size="xs"
								c="dimmed"
							>
								Updated {formatRelativeTime(memory.updatedAt)}
							</Text>
						)}
					</Group>
				</Group>
			</Stack>
		</Paper>
	);
}

export default function MemoriesView({ context }: ContextViewProps) {
	const { data: memories } = useCloudContextMemoriesQuery(context.id);
	const { data: categories } = useCloudContextCategoriesQuery(context.id);
	const { data: entities } = useCloudContextEntitiesQuery(context.id);

	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState("all");
	const [entityFilter, setEntityFilter] = useState<string | null>(null);
	const [sort, setSort] = useState("newest");

	const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
	const [editingMemory, setEditingMemory] = useState<ContextMemory | null>(null);
	const [editText, setEditText] = useState("");
	const [editCategories, setEditCategories] = useState<string[]>([]);

	const entityOptions = useMemo(() => {
		if (!entities) return [];
		return entities.map((e) => ({ label: `${e.name} (${e.type})`, value: e.name }));
	}, [entities]);

	const categoryOptions = useMemo(() => {
		if (!categories) return [];
		return categories.map((c) => c.name);
	}, [categories]);

	const filteredMemories = useMemo(() => {
		if (!memories) return [];

		let result = [...memories];

		if (search) {
			const lower = search.toLowerCase();
			result = result.filter((m) => m.text.toLowerCase().includes(lower));
		}

		if (activeCategory !== "all") {
			result = result.filter((m) => m.categories.includes(activeCategory));
		}

		if (entityFilter) {
			result = result.filter((m) => m.userId === entityFilter);
		}

		switch (sort) {
			case "newest":
				result.sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);
				break;
			case "oldest":
				result.sort(
					(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
				);
				break;
			case "score":
				result.sort((a, b) => b.score - a.score);
				break;
		}

		return result;
	}, [memories, search, activeCategory, entityFilter, sort]);

	const handleEdit = (memory: ContextMemory) => {
		setEditingMemory(memory);
		setEditText(memory.text);
		setEditCategories(memory.categories);
		openDrawer();
	};

	const handleDelete = (memory: ContextMemory) => {
		notifications.show({
			title: "Memory deleted",
			message: `"${memory.text}" has been removed.`,
			color: "red",
		});
	};

	const handleSave = () => {
		closeDrawer();
		notifications.show({
			title: "Memory updated",
			message: "The memory has been saved successfully.",
			color: "green",
		});
	};

	return (
		<>
			<PrimaryTitle fz={32}>Memories</PrimaryTitle>

			<Stack gap="md">
				<Group gap="md">
					<TextInput
						placeholder="Search memories..."
						leftSection={<Icon path={iconSearch} />}
						value={search}
						onChange={(e) => setSearch(e.currentTarget.value)}
						style={{ flex: 1 }}
					/>
					<Select
						data={[{ label: "All entities", value: "" }, ...entityOptions]}
						value={entityFilter ?? ""}
						onChange={(v) => setEntityFilter(v || null)}
						w={200}
						placeholder="Filter by entity"
					/>
					<Select
						data={SORT_OPTIONS}
						value={sort}
						onChange={(v) => setSort(v ?? "newest")}
						w={160}
					/>
				</Group>

				<Chip.Group
					multiple={false}
					value={activeCategory}
					onChange={(v) => setActiveCategory(v as string)}
				>
					<Group gap="xs">
						<Chip
							value="all"
							size="xs"
						>
							All ({memories?.length ?? 0})
						</Chip>
						{categories?.map((cat) => (
							<Chip
								key={cat.name}
								value={cat.name}
								size="xs"
								color={CATEGORY_COLORS[cat.name] ?? "gray"}
							>
								{cat.name} ({cat.count})
							</Chip>
						))}
					</Group>
				</Chip.Group>
			</Stack>

			<Stack gap="sm">
				{filteredMemories.length === 0 ? (
					<Center py={60}>
						<Stack
							align="center"
							gap="sm"
						>
							<Icon
								path={iconChat}
								size="xl"
								c="dimmed"
							/>
							<Text
								fw={600}
								c="bright"
							>
								No memories found
							</Text>
							<Text
								size="sm"
								c="dimmed"
							>
								{search || activeCategory !== "all" || entityFilter
									? "Try adjusting your filters"
									: "This context has no memories yet"}
							</Text>
						</Stack>
					</Center>
				) : (
					filteredMemories.map((memory) => (
						<MemoryCard
							key={memory.id}
							memory={memory}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					))
				)}
			</Stack>

			<Drawer
				opened={drawerOpened}
				onClose={closeDrawer}
				title="Edit memory"
				position="right"
				size="md"
			>
				{editingMemory && (
					<Stack gap="md">
						<Textarea
							label="Memory text"
							value={editText}
							onChange={(e) => setEditText(e.currentTarget.value)}
							minRows={3}
							autosize
						/>

						<MultiSelect
							label="Categories"
							data={categoryOptions}
							value={editCategories}
							onChange={setEditCategories}
						/>

						{Object.keys(editingMemory.metadata).length > 0 && (
							<Box>
								<Text
									size="sm"
									fw={500}
									mb="xs"
								>
									Metadata
								</Text>
								<Stack gap={4}>
									{Object.entries(editingMemory.metadata).map(([key, value]) => (
										<Group
											key={key}
											gap="xs"
										>
											<Badge
												variant="dot"
												size="sm"
											>
												{key}: {value}
											</Badge>
										</Group>
									))}
								</Stack>
							</Box>
						)}

						<Text
							size="xs"
							c="dimmed"
						>
							Created: {new Date(editingMemory.createdAt).toLocaleString()}
						</Text>
						<Text
							size="xs"
							c="dimmed"
						>
							Updated: {new Date(editingMemory.updatedAt).toLocaleString()}
						</Text>

						<Group justify="flex-end">
							<Button
								variant="default"
								onClick={closeDrawer}
							>
								Cancel
							</Button>
							<Button onClick={handleSave}>Save</Button>
						</Group>
					</Stack>
				)}
			</Drawer>
		</>
	);
}
