import { Box, Button, Group, Image, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { Header as Heading, Icon, iconWarning, pictoCapabilites } from "@surrealdb/ui";
import { useDeleteContextMutation } from "~/cloud/mutations/spectron";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useConfirmation } from "~/providers/Confirmation";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

export default function SettingsView({ context }: ContextViewProps) {
	const organization = context.organization_id;
	const [, navigate] = useAbsoluteLocation();
	const deleteContextMutation = useDeleteContextMutation(organization);

	const requestDelete = useConfirmation({
		message: () => (
			<Stack className="selectable">
				<Text>
					You are about to delete the context{" "}
					<Text
						span
						c="bright"
						fw={600}
					>
						{context.name}
					</Text>
					.
				</Text>
				<Text>
					This action{" "}
					<Text
						span
						fw={600}
						c="bright"
					>
						CANNOT
					</Text>{" "}
					be undone, and any associated data and memories will be permanently deleted.
				</Text>
			</Stack>
		),
		confirmText: "Delete context",
		verification: "delete",
		onConfirm: async () => {
			await deleteContextMutation.mutateAsync(context.id);

			const backPath = organization ? `/o/${organization}/overview` : "/overview";

			navigate(backPath);
		},
	});

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
