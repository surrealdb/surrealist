import {
	ActionIcon,
	Badge,
	Button,
	Code,
	CopyButton,
	Group,
	Modal,
	MultiSelect,
	Paper,
	Select,
	Stack,
	Table,
	Tabs,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { Icon, iconCheck, iconDelete, iconEye, iconEyeOff } from "@surrealdb/ui";
import { useState } from "react";
import { useCloudContextApiKeysQuery } from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { ContextViewProps } from "../../types";

const SCOPE_OPTIONS = [
	{ label: "memories:read", value: "memories:read" },
	{ label: "memories:write", value: "memories:write" },
	{ label: "knowledge:read", value: "knowledge:read" },
	{ label: "knowledge:write", value: "knowledge:write" },
];

const EXPIRATION_OPTIONS = [
	{ label: "Never", value: "never" },
	{ label: "30 days", value: "30" },
	{ label: "90 days", value: "90" },
	{ label: "1 year", value: "365" },
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

export default function ApiKeysView({ context }: ContextViewProps) {
	const { data: apiKeys } = useCloudContextApiKeysQuery(context.id);
	const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [newKeyName, setNewKeyName] = useState("");
	const [newKeyScopes, setNewKeyScopes] = useState<string[]>([
		"memories:read",
		"memories:write",
		"knowledge:read",
		"knowledge:write",
	]);
	const [newKeyExpiration, setNewKeyExpiration] = useState("never");

	const endpoint = `https://api.surrealdb.com/v1/contexts/${context.id}`;

	const toggleReveal = (keyId: string) => {
		setRevealedKeys((prev) => {
			const next = new Set(prev);
			if (next.has(keyId)) {
				next.delete(keyId);
			} else {
				next.add(keyId);
			}
			return next;
		});
	};

	const handleCreateKey = () => {
		closeModal();
		notifications.show({
			title: "API key created",
			message:
				"Your new API key has been generated. Copy it now — it will only be shown once.",
			color: "green",
		});
		setNewKeyName("");
		setNewKeyScopes(["memories:read", "memories:write", "knowledge:read", "knowledge:write"]);
		setNewKeyExpiration("never");
	};

	const handleRevoke = (keyName: string) => {
		notifications.show({
			title: "API key revoked",
			message: `"${keyName}" has been permanently revoked.`,
			color: "red",
		});
	};

	const jsSnippet = `import { Memory } from "@surrealdb/memory";

const memory = new Memory({
  apiKey: "sk-ctx-...",
  endpoint: "${endpoint}",
});

// Add a memory
await memory.add([
  { role: "user", content: "I prefer dark mode." },
], { userId: "user-123" });

// Search memories
const results = await memory.search(
  "What are the user preferences?",
  { userId: "user-123" },
);`;

	const pySnippet = `from surrealdb import MemoryClient

client = MemoryClient(
    api_key="sk-ctx-...",
    endpoint="${endpoint}",
)

# Add a memory
client.add(
    [{"role": "user", "content": "I prefer dark mode."}],
    user_id="user-123",
)

# Search memories
results = client.search(
    "What are the user preferences?",
    user_id="user-123",
)`;

	const curlSnippet = `# Add a memory
curl -X POST ${endpoint}/memories \\
  -H "Authorization: Token sk-ctx-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "I prefer dark mode."}],
    "user_id": "user-123"
  }'

# Search memories
curl -X POST ${endpoint}/memories/search \\
  -H "Authorization: Token sk-ctx-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What are the user preferences?",
    "filters": {"AND": [{"user_id": "user-123"}]}
  }'`;

	return (
		<>
			<PrimaryTitle fz={32}>API Keys</PrimaryTitle>

			<Section
				title="Endpoint"
				description="Use these details to connect your agents and applications to this context."
			>
				<Stack gap="sm">
					<Group gap="sm">
						<TextInput
							label="Base URL"
							value={endpoint}
							readOnly
							style={{ flex: 1 }}
						/>
						<CopyButton value={endpoint}>
							{({ copied, copy }) => (
								<Tooltip label={copied ? "Copied" : "Copy"}>
									<ActionIcon
										mt={24}
										variant="subtle"
										onClick={copy}
									>
										<Icon path={copied ? iconCheck : iconEye} />
									</ActionIcon>
								</Tooltip>
							)}
						</CopyButton>
					</Group>
					<Group gap="sm">
						<TextInput
							label="Context ID"
							value={context.id}
							readOnly
							style={{ flex: 1 }}
						/>
						<CopyButton value={context.id}>
							{({ copied, copy }) => (
								<Tooltip label={copied ? "Copied" : "Copy"}>
									<ActionIcon
										mt={24}
										variant="subtle"
										onClick={copy}
									>
										<Icon path={copied ? iconCheck : iconEye} />
									</ActionIcon>
								</Tooltip>
							)}
						</CopyButton>
					</Group>
				</Stack>
			</Section>

			<Section
				title="API keys"
				rightSection={
					<Button
						size="xs"
						variant="gradient"
						onClick={openModal}
					>
						Create key
					</Button>
				}
			>
				<Table.ScrollContainer minWidth={800}>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Name</Table.Th>
								<Table.Th>Key</Table.Th>
								<Table.Th>Scopes</Table.Th>
								<Table.Th>Created</Table.Th>
								<Table.Th>Last used</Table.Th>
								<Table.Th>Expires</Table.Th>
								<Table.Th>Actions</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{apiKeys?.map((apiKey) => (
								<Table.Tr key={apiKey.id}>
									<Table.Td>
										<Text fw={500}>{apiKey.name}</Text>
									</Table.Td>
									<Table.Td>
										<Code>
											{revealedKeys.has(apiKey.id)
												? apiKey.key
												: apiKey.maskedKey}
										</Code>
									</Table.Td>
									<Table.Td>
										<Group gap={4}>
											{apiKey.scopes.map((scope) => (
												<Badge
													key={scope}
													variant="light"
													size="xs"
												>
													{scope}
												</Badge>
											))}
										</Group>
									</Table.Td>
									<Table.Td>
										<Text>{formatRelativeTime(apiKey.createdAt)}</Text>
									</Table.Td>
									<Table.Td>
										<Text>
											{apiKey.lastUsedAt
												? formatRelativeTime(apiKey.lastUsedAt)
												: "Never"}
										</Text>
									</Table.Td>
									<Table.Td>
										<Text>
											{apiKey.expiresAt
												? new Date(apiKey.expiresAt).toLocaleDateString()
												: "Never"}
										</Text>
									</Table.Td>
									<Table.Td>
										<Group gap={4}>
											<ActionIcon
												variant="subtle"
												size="sm"
												onClick={() => toggleReveal(apiKey.id)}
											>
												<Icon
													path={
														revealedKeys.has(apiKey.id)
															? iconEyeOff
															: iconEye
													}
												/>
											</ActionIcon>
											<CopyButton value={apiKey.key}>
												{({ copied, copy }) => (
													<ActionIcon
														variant="subtle"
														size="sm"
														color={copied ? "green" : undefined}
														onClick={copy}
													>
														<Icon
															path={copied ? iconCheck : iconCheck}
														/>
													</ActionIcon>
												)}
											</CopyButton>
											<ActionIcon
												variant="subtle"
												size="sm"
												color="red"
												onClick={() => handleRevoke(apiKey.name)}
											>
												<Icon path={iconDelete} />
											</ActionIcon>
										</Group>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</Section>

			<Section title="Quick start">
				<Paper p="md">
					<Tabs defaultValue="javascript">
						<Tabs.List>
							<Tabs.Tab value="javascript">JavaScript</Tabs.Tab>
							<Tabs.Tab value="python">Python</Tabs.Tab>
							<Tabs.Tab value="curl">cURL</Tabs.Tab>
						</Tabs.List>
						<Tabs.Panel
							value="javascript"
							pt="md"
						>
							<Code block>{jsSnippet}</Code>
						</Tabs.Panel>
						<Tabs.Panel
							value="python"
							pt="md"
						>
							<Code block>{pySnippet}</Code>
						</Tabs.Panel>
						<Tabs.Panel
							value="curl"
							pt="md"
						>
							<Code block>{curlSnippet}</Code>
						</Tabs.Panel>
					</Tabs>
				</Paper>
			</Section>

			<Modal
				opened={modalOpened}
				onClose={closeModal}
				title="Create API key"
			>
				<Stack gap="md">
					<TextInput
						label="Name"
						placeholder="e.g. Production key"
						value={newKeyName}
						onChange={(e) => setNewKeyName(e.currentTarget.value)}
					/>
					<MultiSelect
						label="Scopes"
						data={SCOPE_OPTIONS}
						value={newKeyScopes}
						onChange={setNewKeyScopes}
					/>
					<Select
						label="Expiration"
						data={EXPIRATION_OPTIONS}
						value={newKeyExpiration}
						onChange={(v) => setNewKeyExpiration(v ?? "never")}
					/>
					<Group justify="flex-end">
						<Button
							variant="default"
							onClick={closeModal}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateKey}
							disabled={!newKeyName.trim()}
						>
							Create
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
