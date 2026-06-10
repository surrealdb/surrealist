import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Group,
	Paper,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import {
	SectionTitle as Heading,
	Icon,
	iconCheck,
	iconCopy,
	iconWarning,
	pictoSettings,
	useStable,
} from "@surrealdb/ui";
import { useUpdateContextMutation } from "~/cloud/mutations/spectron";
import { Section } from "~/components/Section";
import { useDeleteContext } from "~/hooks/cloud";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { ContextHero } from "../../../components/ContextHero";
import type { ContextViewProps } from "../../../types";
import classes from "../style.module.scss";

export function GeneralTab({ context }: ContextViewProps) {
	const organization = context.organization_id;
	const updateContextMutation = useUpdateContextMutation(organization);

	const [name, setName] = useInputState(context.name);

	const handleSave = useStable(async () => {
		try {
			const res = await updateContextMutation.mutateAsync({
				id: context.id,
				body: {
					name,
				},
			});

			if (res) {
				showInfo({
					title: "Context updated",
					subtitle: "The details of your context has been updated",
				});
			} else {
				showErrorNotification({
					title: "Failed to update context",
					content: "An error occurred while updating the context",
				});
			}
		} catch (err) {
			showErrorNotification({
				title: "Failed to update context",
				content: err instanceof Error ? err.message : String(err),
			});
		}
	});

	const requestDelete = useDeleteContext(context, `/o/${organization}/overview`);

	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Settings"
				title="General"
				description="Metadata for this context and destructive actions. Update the display name or copy the identifiers your tooling needs."
				art={pictoSettings}
			/>

			{/* CONTEXT DETAILS */}
			<Section
				title="Context details"
				description="Manage the details of your context"
			>
				<TextInput
					value={name}
					label="Name"
					description="The display name of your context"
					onChange={setName}
					maw={400}
				/>

				<CopyableField
					label="Context ID"
					description="This ID may be requested by the SurrealDB support team"
					value={context.id}
				/>

				<CopyableField
					label="Host"
					description="The base URL agents and SDKs connect to"
					value={context.host}
				/>

				<CopyableField
					label="Region"
					description="Where this context is hosted"
					value={context.region}
				/>

				<Box mt="sm">
					<Button
						size="xs"
						variant="gradient"
						disabled={name === context.name || name.trim().length === 0}
						loading={updateContextMutation.isPending}
						onClick={handleSave}
					>
						Save changes
					</Button>
				</Box>
			</Section>

			{/* DANGER ZONE */}
			<Box>
				<Heading
					kicker="Danger zone"
					order={2}
					mb="sm"
					kickerProps={{ c: "red" }}
					titleProps={{ fz: 22, mt: 4 }}
				>
					Irreversible actions
				</Heading>
				<Paper
					p="lg"
					radius="md"
					className={classes.dangerPane}
				>
					<Group
						justify="space-between"
						align="flex-start"
						gap="md"
						wrap="wrap"
					>
						<Group
							gap="sm"
							align="flex-start"
							wrap="nowrap"
							maw={560}
						>
							<ThemeIcon
								size={36}
								radius="md"
								variant="light"
								color="red"
							>
								<Icon path={iconWarning} />
							</ThemeIcon>
							<Box>
								<Text
									fw={600}
									c="bright"
								>
									Delete context
								</Text>
								<Text
									mt={4}
									className="selectable"
								>
									Permanently remove this context along with every memory,
									knowledge source, and API key connected to it. This cannot be
									undone.
								</Text>
								<Button
									mt="md"
									color="red"
									onClick={() => requestDelete()}
								>
									Delete context
								</Button>
							</Box>
						</Group>
					</Group>
				</Paper>
			</Box>
		</Stack>
	);
}

interface CopyableFieldProps {
	label: string;
	description?: string;
	value: string;
}

function CopyableField({ label, description, value }: CopyableFieldProps) {
	return (
		<TextInput
			maw={400}
			label={label}
			description={description}
			value={value}
			readOnly
			rightSection={
				<CopyButton value={value}>
					{({ copied, copy }) => (
						<ActionIcon
							variant={copied ? "gradient" : undefined}
							aria-label={`Copy ${label}`}
							radius="xs"
							size="md"
							onClick={copy}
						>
							<Icon path={copied ? iconCheck : iconCopy} />
						</ActionIcon>
					)}
				</CopyButton>
			}
			styles={{
				input: {
					fontFamily: "var(--mantine-font-family-monospace)",
				},
			}}
		/>
	);
}
