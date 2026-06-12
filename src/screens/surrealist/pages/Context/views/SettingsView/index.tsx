import {
	ActionIcon,
	Badge,
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
	Tooltip,
} from "@mantine/core";
import {
	Icon,
	iconCheck,
	iconCog,
	iconCopy,
	iconDelete,
	iconServer,
	iconTag,
	iconWarning,
	pictoCapabilitesGradient,
} from "@surrealdb/ui";
import { useState } from "react";
import { useDeleteContextMutation } from "~/cloud/mutations/spectron";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAbsoluteLocation } from "~/hooks/routing";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

export default function SettingsView({ context }: ContextViewProps) {
	const organization = context.organization_id;
	const [, navigate] = useAbsoluteLocation();
	const deleteContextMutation = useDeleteContextMutation(organization);
	const [confirmName, setConfirmName] = useState("");
	const [confirmOpen, setConfirmOpen] = useState(false);

	const canDelete = confirmName === context.name;

	const handleDelete = async () => {
		await deleteContextMutation.mutateAsync(context.id);

		const backPath = organization ? `/o/${organization}/overview` : "/";
		navigate(backPath);
	};

	const properties = [
		{ label: "Name", icon: iconTag, value: context.name },
		{ label: "Region", icon: iconServer, value: context.region },
		{ label: "Host", icon: iconServer, value: context.host },
		{ label: "Context ID", icon: iconCog, value: context.id },
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
					src={pictoCapabilitesGradient}
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
									path={iconCog}
									size="xs"
								/>
							}
						>
							Configuration
						</Badge>
					</Group>
					<Box maw={620}>
						<PrimaryTitle fz={36}>Settings</PrimaryTitle>
						<Text
							mt="xs"
							lh={1.55}
							className="selectable"
						>
							Metadata for this context and destructive actions. Editable settings
							will land here as Spectron moves out of preview.
						</Text>
					</Box>
				</Stack>
			</Paper>

			{/* GENERAL */}
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
							General
						</Text>
						<PrimaryTitle
							fz={22}
							mt={4}
						>
							Context details
						</PrimaryTitle>
					</Box>
				</Group>
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
			</Box>

			{/* DANGER ZONE */}
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
							c="red.5"
							tt="uppercase"
							style={{ letterSpacing: "0.08em" }}
						>
							Danger zone
						</Text>
						<PrimaryTitle
							fz={22}
							mt={4}
						>
							Irreversible actions
						</PrimaryTitle>
					</Box>
				</Group>

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
									fz="sm"
									mt={4}
									className="selectable"
								>
									Permanently remove this context along with every memory,
									knowledge source, and API key connected to it. This cannot be
									undone.
								</Text>
							</Box>
						</Group>
						{!confirmOpen && (
							<Button
								color="red"
								variant="light"
								leftSection={<Icon path={iconDelete} />}
								onClick={() => setConfirmOpen(true)}
							>
								Delete context…
							</Button>
						)}
					</Group>

					{confirmOpen && (
						<Stack
							gap="sm"
							mt="lg"
						>
							<TextInput
								label={
									<Text
										fz="sm"
										c="bright"
									>
										Type{" "}
										<Text
											span
											fw={700}
										>
											{context.name}
										</Text>{" "}
										to confirm
									</Text>
								}
								placeholder={context.name}
								value={confirmName}
								onChange={(e) => setConfirmName(e.currentTarget.value)}
								autoFocus
							/>
							<Group justify="flex-end">
								<Button
									variant="default"
									onClick={() => {
										setConfirmOpen(false);
										setConfirmName("");
									}}
								>
									Cancel
								</Button>
								<Button
									color="red"
									leftSection={<Icon path={iconDelete} />}
									disabled={!canDelete}
									loading={deleteContextMutation.isPending}
									onClick={handleDelete}
								>
									Delete permanently
								</Button>
							</Group>
						</Stack>
					)}
				</Paper>
			</Box>
		</Stack>
	);
}
