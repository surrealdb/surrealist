import {
	ActionIcon,
	Alert,
	Button,
	Code,
	CopyButton,
	Group,
	Modal,
	Paper,
	Stack,
	Table,
	Tabs,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconCheck, iconCopy, iconDelete, iconEye } from "@surrealdb/ui";
import { useState } from "react";
import {
	useCreateContextApiKeyMutation,
	useDeleteContextApiKeyMutation,
} from "~/cloud/mutations/spectron";
import { useCloudContextApiKeysQuery } from "~/cloud/queries/contexts";
import { CodeSnippet } from "~/components/CodeSnippet";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import type { CodeLang, ContextApiKey, Snippets } from "~/types";
import type { ContextViewProps } from "../../types";

export default function ApiKeysView({ context }: ContextViewProps) {
	const organization = context.organization_id;
	const { data: apiKeys } = useCloudContextApiKeysQuery(organization, context.id);
	const createKeyMutation = useCreateContextApiKeyMutation(organization, context.id);
	const deleteKeyMutation = useDeleteContextApiKeyMutation(organization, context.id);

	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [newKeyName, setNewKeyName] = useState("");
	const [createdKey, setCreatedKey] = useState<ContextApiKey | null>(null);
	const [quickStartLang, setQuickStartLang] = useState<CodeLang>("js");

	const endpoint = `https://${context.host}`;

	const handleCreateKey = async () => {
		const result = await createKeyMutation.mutateAsync({ name: newKeyName });
		setCreatedKey(result);
		setNewKeyName("");
		closeModal();
	};

	const handleDismissCreatedKey = () => {
		setCreatedKey(null);
	};

	const handleRevoke = (keyId: string) => {
		deleteKeyMutation.mutate(keyId);
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

	const quickStartSnippets: Snippets = {
		js: jsSnippet,
		py: pySnippet,
		cli: curlSnippet,
	};

	const EDITOR_LANGS: Record<CodeLang, string> = {
		js: "javascript",
		py: "python",
		cli: "bash",
	} as Record<CodeLang, string>;

	return (
		<>
			<PrimaryTitle fz={32}>API Keys</PrimaryTitle>

			{createdKey?.key && (
				<Alert
					color="green"
					title="API key created"
					withCloseButton
					onClose={handleDismissCreatedKey}
				>
					<Text
						mb="xs"
						className="selectable"
					>
						Copy your API key now. It will only be shown once.
					</Text>
					<Group gap="sm">
						<Code className="selectable">{createdKey.key}</Code>
						<CopyButton value={createdKey.key}>
							{({ copied, copy }) => (
								<ActionIcon
									variant="subtle"
									size="sm"
									color={copied ? "green" : undefined}
									onClick={copy}
								>
									<Icon path={copied ? iconCheck : iconCopy} />
								</ActionIcon>
							)}
						</CopyButton>
					</Group>
				</Alert>
			)}

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
				<Table.ScrollContainer minWidth={500}>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Name</Table.Th>
								<Table.Th>ID</Table.Th>
								<Table.Th>Actions</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{apiKeys?.map((apiKey) => (
								<Table.Tr key={apiKey.id}>
									<Table.Td>
										<Text
											fw={500}
											className="selectable"
										>
											{apiKey.name}
										</Text>
									</Table.Td>
									<Table.Td>
										<Code className="selectable">{apiKey.id}</Code>
									</Table.Td>
									<Table.Td>
										<ActionIcon
											variant="subtle"
											size="sm"
											color="red"
											onClick={() => handleRevoke(apiKey.id)}
											loading={deleteKeyMutation.isPending}
										>
											<Icon path={iconDelete} />
										</ActionIcon>
									</Table.Td>
								</Table.Tr>
							))}
							{apiKeys?.length === 0 && (
								<Table.Tr>
									<Table.Td colSpan={3}>
										<Text
											ta="center"
											py="lg"
										>
											No API keys created yet
										</Text>
									</Table.Td>
								</Table.Tr>
							)}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</Section>

			<Section title="Quick start">
				<Paper p="md">
					<Tabs
						value={quickStartLang}
						onChange={(v) => setQuickStartLang((v as CodeLang) ?? "js")}
						mb="md"
					>
						<Tabs.List>
							<Tabs.Tab value="js">JavaScript</Tabs.Tab>
							<Tabs.Tab value="py">Python</Tabs.Tab>
							<Tabs.Tab value="cli">cURL</Tabs.Tab>
						</Tabs.List>
					</Tabs>
					<CodeSnippet
						values={quickStartSnippets}
						language={quickStartLang}
						editorLanguage={EDITOR_LANGS[quickStartLang]}
					/>
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
							loading={createKeyMutation.isPending}
						>
							Create
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
