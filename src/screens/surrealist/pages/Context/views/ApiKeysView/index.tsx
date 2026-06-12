import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Code,
	CopyButton,
	Group,
	Image,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Table,
	Tabs,
	Text,
	TextInput,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	Icon,
	iconAPI,
	iconCheck,
	iconCheckCircle,
	iconCopy,
	iconDelete,
	iconKey,
	iconPlus,
	iconServer,
	pictoKeyGradient,
} from "@surrealdb/ui";
import { useState } from "react";
import {
	useCreateContextApiKeyMutation,
	useDeleteContextApiKeyMutation,
} from "~/cloud/mutations/spectron";
import { useCloudContextApiKeysQuery } from "~/cloud/queries/contexts";
import { CodeSnippet } from "~/components/CodeSnippet";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import type { CodeLang, ContextApiKey, Snippets } from "~/types";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

const EDITOR_LANGS: Record<CodeLang, string> = {
	js: "javascript",
	py: "python",
	cli: "bash",
} as Record<CodeLang, string>;

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

	const endpointRows: { label: string; icon: string; value: string }[] = [
		{ label: "Base URL", icon: iconServer, value: endpoint },
		{ label: "Context ID", icon: iconAPI, value: context.id },
	];

	return (
		<Stack gap={32}>
			{/* HERO */}
			<Paper
				p="xl"
				radius="lg"
				className={classes.hero}
			>
				<Image
					src={pictoKeyGradient}
					className={classes.heroArt}
					alt=""
					aria-hidden
				/>
				<Stack
					gap="md"
					pos="relative"
					style={{ zIndex: 1 }}
				>
					<Group gap="xs">
						<Badge
							size="sm"
							variant="light"
							color="violet"
							leftSection={
								<Icon
									path={iconKey}
									size="xs"
								/>
							}
						>
							Access
						</Badge>
						<Badge
							size="sm"
							variant="default"
							leftSection={
								<Icon
									path={iconCheckCircle}
									size="xs"
								/>
							}
						>
							{apiKeys?.length ?? 0} active
						</Badge>
					</Group>
					<Box maw={620}>
						<PrimaryTitle fz={36}>API keys</PrimaryTitle>
						<Text
							mt="xs"
							lh={1.55}
							className="selectable"
						>
							Connect agents, SDKs, and automations to this context. Use the endpoint
							below alongside a key to start reading and writing memory.
						</Text>
					</Box>
				</Stack>
			</Paper>

			{createdKey?.key && (
				<Alert
					color="green"
					title="API key created"
					withCloseButton
					onClose={handleDismissCreatedKey}
					className={classes.keyCallout}
					icon={<Icon path={iconCheckCircle} />}
				>
					<Text
						mb="xs"
						className="selectable"
					>
						Copy your API key now. It will only be shown once.
					</Text>
					<Group
						gap="sm"
						wrap="nowrap"
					>
						<Code
							className="selectable"
							style={{ flex: 1, wordBreak: "break-all" }}
						>
							{createdKey.key}
						</Code>
						<CopyButton value={createdKey.key}>
							{({ copied, copy }) => (
								<Button
									variant="light"
									color={copied ? "green" : "violet"}
									size="xs"
									leftSection={<Icon path={copied ? iconCheck : iconCopy} />}
									onClick={copy}
								>
									{copied ? "Copied" : "Copy key"}
								</Button>
							)}
						</CopyButton>
					</Group>
				</Alert>
			)}

			{/* ENDPOINT */}
			<Box>
				<Group
					justify="space-between"
					align="flex-end"
					mb="sm"
					wrap="wrap"
				>
					<Box>
						<Text
							fz="xs"
							fw={600}
							c="violet.4"
							tt="uppercase"
							style={{ letterSpacing: "0.08em" }}
						>
							Connect
						</Text>
						<PrimaryTitle
							fz={22}
							mt={4}
						>
							Endpoint details
						</PrimaryTitle>
					</Box>
				</Group>
				<Paper
					p="md"
					radius="md"
					withBorder
				>
					<Stack gap="xs">
						{endpointRows.map((row) => (
							<Box
								key={row.label}
								className={classes.endpointRow}
							>
								<Group
									gap="sm"
									wrap="nowrap"
								>
									<ThemeIcon
										size={28}
										radius="md"
										variant="light"
										color="slate"
									>
										<Icon path={row.icon} />
									</ThemeIcon>
									<Text
										fw={600}
										c="bright"
										fz="sm"
									>
										{row.label}
									</Text>
								</Group>
								<Box
									className={`${classes.valueChip} selectable`}
									component="code"
								>
									{row.value}
								</Box>
								<CopyButton value={row.value}>
									{({ copied, copy }) => (
										<Tooltip label={copied ? "Copied" : "Copy"}>
											<ActionIcon
												variant="subtle"
												color={copied ? "green" : "slate"}
												onClick={copy}
												aria-label={`Copy ${row.label}`}
											>
												<Icon path={copied ? iconCheck : iconCopy} />
											</ActionIcon>
										</Tooltip>
									)}
								</CopyButton>
							</Box>
						))}
					</Stack>
				</Paper>
			</Box>

			{/* KEYS TABLE */}
			<Box>
				<Group
					justify="space-between"
					align="flex-end"
					mb="sm"
					wrap="wrap"
				>
					<Box>
						<Text
							fz="xs"
							fw={600}
							c="violet.4"
							tt="uppercase"
							style={{ letterSpacing: "0.08em" }}
						>
							Credentials
						</Text>
						<PrimaryTitle
							fz={22}
							mt={4}
						>
							Manage API keys
						</PrimaryTitle>
					</Box>
					<Button
						size="sm"
						variant="gradient"
						leftSection={<Icon path={iconPlus} />}
						onClick={openModal}
					>
						Create key
					</Button>
				</Group>
				<Paper
					radius="md"
					withBorder
				>
					<Table.ScrollContainer minWidth={500}>
						<Table
							striped
							verticalSpacing="sm"
							horizontalSpacing="md"
						>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Name</Table.Th>
									<Table.Th>Key ID</Table.Th>
									<Table.Th style={{ width: 80 }}>Actions</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{apiKeys?.map((apiKey) => (
									<Table.Tr key={apiKey.id}>
										<Table.Td>
											<Group
												gap="sm"
												wrap="nowrap"
											>
												<ThemeIcon
													size={28}
													radius="md"
													variant="light"
													color="violet"
												>
													<Icon path={iconKey} />
												</ThemeIcon>
												<Text
													fw={500}
													c="bright"
													className="selectable"
												>
													{apiKey.name}
												</Text>
											</Group>
										</Table.Td>
										<Table.Td>
											<Code className="selectable">{apiKey.id}</Code>
										</Table.Td>
										<Table.Td>
											<Tooltip label="Revoke key">
												<ActionIcon
													variant="subtle"
													size="sm"
													color="red"
													aria-label={`Revoke ${apiKey.name}`}
													onClick={() => handleRevoke(apiKey.id)}
													loading={deleteKeyMutation.isPending}
												>
													<Icon path={iconDelete} />
												</ActionIcon>
											</Tooltip>
										</Table.Td>
									</Table.Tr>
								))}
								{apiKeys?.length === 0 && (
									<Table.Tr>
										<Table.Td colSpan={3}>
											<Stack
												gap="xs"
												align="center"
												py="xl"
											>
												<ThemeIcon
													size={48}
													radius="xl"
													variant="light"
													color="slate"
												>
													<Icon
														path={iconKey}
														size="xl"
													/>
												</ThemeIcon>
												<Text
													fw={600}
													c="bright"
												>
													No API keys yet
												</Text>
												<Text
													fz="sm"
													className="selectable"
												>
													Create your first key to connect an agent.
												</Text>
												<Button
													mt="xs"
													size="sm"
													variant="light"
													color="violet"
													leftSection={<Icon path={iconPlus} />}
													onClick={openModal}
												>
													Create key
												</Button>
											</Stack>
										</Table.Td>
									</Table.Tr>
								)}
							</Table.Tbody>
						</Table>
					</Table.ScrollContainer>
				</Paper>
			</Box>

			{/* QUICK START */}
			<Box>
				<Group
					justify="space-between"
					align="flex-end"
					mb="sm"
					wrap="wrap"
				>
					<Box>
						<Text
							fz="xs"
							fw={600}
							c="violet.4"
							tt="uppercase"
							style={{ letterSpacing: "0.08em" }}
						>
							Quick start
						</Text>
						<PrimaryTitle
							fz={22}
							mt={4}
						>
							Paste this into your agent
						</PrimaryTitle>
					</Box>
				</Group>
				<Paper
					p="md"
					radius="md"
					withBorder
				>
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
					<SimpleGrid
						cols={{ base: 1, md: 3 }}
						spacing="xs"
						mt="md"
					>
						<Group
							gap="xs"
							wrap="nowrap"
						>
							<Icon
								path={iconCheckCircle}
								size="sm"
								c="violet.4"
							/>
							<Text
								fz="xs"
								className="selectable"
							>
								Swap <Code>sk-ctx-…</Code> for your key
							</Text>
						</Group>
						<Group
							gap="xs"
							wrap="nowrap"
						>
							<Icon
								path={iconCheckCircle}
								size="sm"
								c="violet.4"
							/>
							<Text
								fz="xs"
								className="selectable"
							>
								Endpoint is already filled in for this context
							</Text>
						</Group>
						<Group
							gap="xs"
							wrap="nowrap"
						>
							<Icon
								path={iconCheckCircle}
								size="sm"
								c="violet.4"
							/>
							<Text
								fz="xs"
								className="selectable"
							>
								Scope memories per user via <Code>user_id</Code>
							</Text>
						</Group>
					</SimpleGrid>
				</Paper>
			</Box>

			<Modal
				opened={modalOpened}
				onClose={closeModal}
				title={<Text fw={600}>Create API key</Text>}
			>
				<Stack gap="md">
					<Text
						fz="sm"
						className="selectable"
					>
						Give your key a name so you can identify it later. You will see the secret
						value only once.
					</Text>
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
							variant="gradient"
							onClick={handleCreateKey}
							disabled={!newKeyName.trim()}
							loading={createKeyMutation.isPending}
						>
							Create key
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
}
