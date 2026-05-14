import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Group,
	Image,
	Paper,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import {
	Header as Heading,
	Icon,
	iconCheck,
	iconCopy,
	iconWarning,
	pictoCapabilites,
	useStable,
} from "@surrealdb/ui";
import { useUpdateContextMutation } from "~/cloud/mutations/spectron";
import { Section } from "~/components/Section";
import { useDeleteContext } from "~/hooks/cloud";
import { showErrorNotification, showInfo } from "~/util/helpers";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

export default function SettingsView({ context }: ContextViewProps) {
	const organization = context.organization_id;
	const updateContextMutation = useUpdateContextMutation(organization);

	const [name, setName] = useInputState(context.name);

	const handleSave = useStable(async () => {
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
	});

	const requestDelete = useDeleteContext(context, `/o/${organization}/overview`);
	// const properties = [
	// 	{ label: "Name", icon: iconTag, value: context.name },
	// 	{ label: "Region", icon: iconServer, value: context.region },
	// 	{ label: "Host", icon: iconServer, value: context.host },
	// 	{ label: "Context ID", icon: iconCog, value: context.id },
	// ];

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
					src={pictoCapabilites}
					className={classes.heroArt}
					alt=""
					aria-hidden
				/>

				<Heading
					kicker="Context"
					description="Metadata for this context and destructive actions. Editable settings will land here as Spectron moves out of preview."
					titleProps={{ variant: "gradient" }}
				>
					Settings
				</Heading>
			</Paper>

			{/* GENERAL */}
			{/* <Box>
				<Heading
					kicker="General"
					order={2}
					mb="sm"
					titleProps={{ fz: 22, mt: 4 }}
				>
					Context details
				</Heading>
				<Paper
					p="md"
					radius="md"
					withBorder
				>
					<Stack gap="xs">
						{properties.map((prop) => (
							<Box
								key={prop.label}
								className={classes.propertyRow}
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
										<Icon path={prop.icon} />
									</ThemeIcon>
									<Text
										fw={600}
										c="bright"
										fz="sm"
									>
										{prop.label}
									</Text>
								</Group>
								<Box
									className={`${classes.propertyValue} selectable`}
									component="code"
								>
									{prop.value}
								</Box>
								<CopyButton value={prop.value}>
									{({ copied, copy }) => (
										<Tooltip label={copied ? "Copied" : "Copy"}>
											<ActionIcon
												variant="subtle"
												color={copied ? "green" : "slate"}
												onClick={copy}
												aria-label={`Copy ${prop.label}`}
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
			</Box> */}

			<Section
				title="Context details"
				description="Manage the details of your context"
			>
				<TextInput
					maw={400}
					label="Context ID"
					description="This ID may be requested by the SurrealDB support team"
					value={context.id}
					rightSection={
						<CopyButton value={context.id}>
							{({ copied, copy }) => (
								<ActionIcon
									variant={copied ? "gradient" : undefined}
									aria-label="Copy context ID"
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

				<TextInput
					value={name}
					label="Name"
					description="The display name of your context"
					onChange={setName}
					maw={400}
				/>

				<Box mt="sm">
					<Button
						size="xs"
						variant="gradient"
						disabled={name === context.name}
						loading={updateContextMutation.isPending}
						onClick={handleSave}
					>
						Save changes
					</Button>
				</Box>
			</Section>

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
