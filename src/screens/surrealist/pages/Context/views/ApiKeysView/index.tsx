import {
	ActionIcon,
	Alert,
	Box,
	Button,
	CopyButton,
	Group,
	Image,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Table,
	Text,
	TextInput,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	brandJavaScript,
	brandPython,
	Header as Heading,
	HoverGlow,
	Icon,
	iconAPI,
	iconCheck,
	iconChevronRight,
	iconCopy,
	iconKey,
	iconPlus,
	iconTrash,
	pictoKeyGradient,
} from "@surrealdb/ui";
import { useState } from "react";
import { Link } from "wouter";
import {
	useCreateContextApiKeyMutation,
	useDeleteContextApiKeyMutation,
} from "~/cloud/mutations/spectron";
import { useCloudContextApiKeysQuery } from "~/cloud/queries/contexts";
import type { ContextApiKey } from "~/types";
import { ON_FOCUS_SELECT } from "~/util/helpers";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

type IntegrationTab = "javascript" | "python" | "api";

interface IntegrationQuickLink {
	tab: IntegrationTab;
	label: string;
	description: string;
	img?: string;
	icon?: string;
}

const INTEGRATION_QUICK_LINKS: IntegrationQuickLink[] = [
	{
		tab: "javascript",
		label: "JavaScript",
		description: "Read the JavaScript guide",
		img: brandJavaScript,
	},
	{
		tab: "python",
		label: "Python",
		description: "Read the Python guide",
		img: brandPython,
	},
	{
		tab: "api",
		label: "REST API",
		description: "Read the REST API guide",
		icon: iconAPI,
	},
];

export default function ApiKeysView({ context }: ContextViewProps) {
	const organization = context.organization_id;
	const { data: apiKeys } = useCloudContextApiKeysQuery(organization, context.id);
	const createKeyMutation = useCreateContextApiKeyMutation(organization, context.id);
	const deleteKeyMutation = useDeleteContextApiKeyMutation(organization, context.id);

	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [newKeyName, setNewKeyName] = useState("");
	const [createdKey, setCreatedKey] = useState<ContextApiKey | null>(null);

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

	const integrationBasePath = `/s/${context.organization_id}/${context.id}/integration`;

	return (
		<Stack gap={32}>
			{/* HERO */}
			<Paper
				p="xl"
				radius="lg"
				variant="glass"
				className={classes.hero}
			>
				<Image
					src={pictoKeyGradient}
					className={classes.heroArt}
					alt=""
					aria-hidden
				/>
				<Heading
					kicker="Access"
					description="Connect agents, SDKs, and automations to this context. Create a key, then follow the integration guide for your stack."
					titleProps={{ variant: "gradient" }}
					descriptionProps={{ maw: 640 }}
				>
					API keys
				</Heading>
			</Paper>

			{createdKey?.key && (
				<Alert
					color="blue"
					variant="light"
					title="API key created"
					withCloseButton
					onClose={handleDismissCreatedKey}
					icon={<Icon path={iconKey} />}
					style={{
						borderColor: "rgba(from var(--mantine-color-blue-4) r g b / 0.15)",
					}}
				>
					<Text
						mb="xs"
						className="selectable"
					>
						Copy your API key now, as it will no longer be visible after this point.
					</Text>
					<Group
						mt="md"
						gap="sm"
						wrap="nowrap"
					>
						<CopyButton value={createdKey.key}>
							{({ copied, copy }) => (
								<Box
									onClick={copy}
									flex={1}
								>
									<TextInput
										value={createdKey.key}
										variant="unstyled"
										className={classes.preview}
										onFocus={ON_FOCUS_SELECT}
										leftSection={
											<Icon
												path={copied ? iconCheck : iconCopy}
												c="bright"
											/>
										}
										readOnly
									/>
								</Box>
							)}
						</CopyButton>
					</Group>
				</Alert>
			)}

			{/* KEYS TABLE */}
			<Box>
				<Group
					justify="space-between"
					gap="md"
				>
					<Heading
						kicker="Credentials"
						order={2}
						titleProps={{ fz: 22, mt: 4 }}
					>
						Manage API keys
					</Heading>
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
					mt="md"
					radius="sm"
					withBorder
					style={{ overflow: "hidden" }}
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
										<Table.Td w={0}>
											<Tooltip label="Revoke key">
												<ActionIcon
													variant="subtle"
													size="sm"
													color="red"
													aria-label={`Revoke ${apiKey.name}`}
													onClick={() => handleRevoke(apiKey.id)}
													loading={deleteKeyMutation.isPending}
												>
													<Icon path={iconTrash} />
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
													mt="sm"
													size="sm"
													leftSection={<Icon path={iconPlus} />}
													onClick={openModal}
												>
													Create API key
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
				<Heading
					kicker="Quick start"
					order={2}
					mb="sm"
					titleProps={{ fz: 22, mt: 4 }}
				>
					Authenticate with Spectron
				</Heading>
				<SimpleGrid
					cols={{ base: 1, sm: 3 }}
					spacing="md"
				>
					{INTEGRATION_QUICK_LINKS.map((item) => (
						<Link
							key={item.tab}
							href={`${integrationBasePath}?tab=${item.tab}`}
							className={classes.integrationLink}
						>
							<HoverGlow h="100%">
								<Paper
									p="md"
									radius="md"
									withBorder
									className={classes.integrationCard}
									h="100%"
								>
									<Group
										wrap="nowrap"
										align="center"
										h="100%"
									>
										{item.img ? (
											<Image
												src={item.img}
												w={28}
												h={28}
												alt=""
												style={{ flexShrink: 0 }}
											/>
										) : (
											<ThemeIcon
												size={32}
												radius="sm"
												variant="light"
											>
												<Icon
													path={item.icon ?? iconAPI}
													size="lg"
												/>
											</ThemeIcon>
										)}
										<Box flex={1}>
											<Text
												fw={600}
												c="bright"
											>
												{item.label}
											</Text>
											<Text>{item.description}</Text>
										</Box>
										<Icon
											path={iconChevronRight}
											c="slate"
											ml="md"
										/>
									</Group>
								</Paper>
							</HoverGlow>
						</Link>
					))}
				</SimpleGrid>
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
						<Button onClick={closeModal}>Cancel</Button>
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
