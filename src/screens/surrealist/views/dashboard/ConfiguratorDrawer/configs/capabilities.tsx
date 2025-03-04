import classes from "../style.module.scss";

import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Checkbox,
	Collapse,
	Divider,
	Group,
	List,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { ReactNode, useMemo, useState } from "react";
import { BetaBadge } from "~/components/BetaBadge";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { CloudInstance, Selectable } from "~/types";
import {
	iconCancel,
	iconCheck,
	iconChevronDown,
	iconChevronUp,
	iconClose,
	iconHelp,
	iconPlus,
} from "~/util/icons";

const RPCS = [
	"use",
	"info",
	"version",
	"signup",
	"signin",
	"authenticate",
	"invalidate",
	"let",
	"unset",
	"live",
	"kill",
	"query",
	"graphql",
	"run",
	"select",
	"create",
	"insert",
	"insert_relation",
	"update",
	"upsert",
	"relate",
	"merge",
	"patch",
	"delete",
];

const ENDPOINTS = [
	"status",
	"health",
	"version",
	"import",
	"export",
	"signup",
	"signin",
	"key",
	"sql",
	"graphql",
	"ml",
];

export interface ConfigurationCapabilitiesProps {
	instance: CloudInstance;
	onClose: () => void;
}

export function ConfigurationCapabilities({ onClose }: ConfigurationCapabilitiesProps) {
	const [scripting, setScripting] = useState(false);
	const [guestAccess, setGuestAccess] = useState(false);
	const [graphQL, setGraphQL] = useState(false);
	const [enabledRpcs, setEnabledRpcs] = useState<string[]>(RPCS);
	const [enabledEndpoints, setEnabledEndpoints] = useState<string[]>(ENDPOINTS);
	const [networkAccess, setNetworkAccess] = useState({ base: false, overrides: [] as string[] });
	const [functions, setFunctions] = useState({ base: true, overrides: [] as string[] });

	const rpcs = useMemo(() => {
		return RPCS.map((rpc) => ({
			label: rpc,
			value: rpc,
		}));
	}, []);

	const endpoints = useMemo(() => {
		return ENDPOINTS.map((endpoint) => ({
			label: endpoint,
			value: endpoint,
		}));
	}, []);

	return (
		<Stack
			h="100%"
			gap={0}
		>
			<Divider />

			<Box
				pos="relative"
				flex={1}
			>
				<ScrollArea
					pos="absolute"
					inset={0}
					className={classes.scrollArea}
				>
					<Stack
						gap="sm"
						p="xl"
						mih="100%"
					>
						<Box mb="xl">
							<Text
								fz="xl"
								c="bright"
								fw={600}
							>
								Manage capabilities
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								Configure instance capabilities to control the functionality
								available to users, opt-in to beta features, and restrict access to
								specific resources.
							</Text>
						</Box>

						<Alert
							mb="xl"
							color="blue"
							title="Coming soon"
						>
							Customized capabilities will be available in a future update
						</Alert>

						<BinaryCapability
							name="Scripting"
							description="Allow execution of embedded scripting functions"
							value={scripting}
							onChange={setScripting}
							disabled
						/>

						<Divider />

						<BinaryCapability
							name="Guest Access"
							description="Allow non-authenticated users to execute queries when authentication is enabled"
							value={guestAccess}
							onChange={setGuestAccess}
							disabled
						/>

						<Divider />

						<BinaryCapability
							name={
								<Group gap="xs">
									GraphQL
									<BetaBadge />
								</Group>
							}
							description="Allow execution queries using the GraphQL API"
							value={graphQL}
							onChange={setGraphQL}
							disabled
						/>

						<Divider />

						<OptionsCapability
							data={rpcs}
							name="Enabled RPC methods"
							description="Select which RPC methods are available for use"
							value={enabledRpcs}
							onChange={setEnabledRpcs}
							disabled
						/>

						<Divider />

						<OptionsCapability
							data={endpoints}
							name="Enabled HTTP endpoints"
							description="Select which HTTP endpoints are available for use"
							value={enabledEndpoints}
							onChange={setEnabledEndpoints}
							disabled
						/>

						<Divider />

						<GranularCapability
							name="Network access"
							description="Configure outbound network access to specific targets"
							what="network targets"
							value={networkAccess}
							onChange={setNetworkAccess}
							disabled
						/>

						<Divider />

						<GranularCapability
							name="Functions"
							description="Configure enabled functions for use in queries"
							what="functions"
							value={functions}
							onChange={setFunctions}
							disabled
						/>
					</Stack>
				</ScrollArea>
			</Box>

			<Group p="xl">
				<Button
					onClick={onClose}
					color="slate"
					variant="light"
					flex={1}
				>
					Close
				</Button>
				<Button
					type="submit"
					variant="gradient"
					disabled
					flex={1}
				>
					Apply capabilities
				</Button>
			</Group>
		</Stack>
	);
}

interface CapabilityProps<V> {
	name: ReactNode;
	description?: ReactNode;
	value: V;
	disabled?: boolean;
	onChange: (value: V) => void;
}

function BinaryCapability({
	name,
	description,
	value,
	disabled,
	onChange,
}: CapabilityProps<boolean>) {
	return (
		<Group
			gap="xs"
			mih={36}
		>
			<Text
				fz="lg"
				fw={500}
				c="bright"
			>
				{name}
			</Text>
			{description && (
				<Tooltip label={description}>
					<div>
						<Icon
							path={iconHelp}
							size="sm"
						/>
					</div>
				</Tooltip>
			)}
			<Spacer />
			<Checkbox
				checked={value}
				disabled={disabled}
				onChange={(event) => onChange(event.currentTarget.checked)}
			/>
		</Group>
	);
}

function OptionsCapability({
	name,
	description,
	value,
	data,
	disabled,
	onChange,
}: CapabilityProps<string[]> & { data: Selectable[] }) {
	const isLight = useIsLight();
	const [isExpanded, expandedHandle] = useBoolean();

	const updateSelection = (event: React.ChangeEvent<HTMLInputElement>, item: string) => {
		const newValue = event.currentTarget.checked
			? [...value, item]
			: value.filter((selected) => selected !== item);

		onChange(newValue);
	};

	const text =
		value.length === data.length
			? "All enabled"
			: value.length === 0
				? "None enabled"
				: `${value.length} Enabled`;

	return (
		<Box>
			<Group
				gap="xs"
				mih={36}
			>
				<Text
					fz="lg"
					fw={500}
					c="bright"
				>
					{name}
				</Text>
				{description && (
					<Tooltip label={description}>
						<div>
							<Icon
								path={iconHelp}
								size="sm"
							/>
						</div>
					</Tooltip>
				)}
				<Spacer />
				<UnstyledButton onClick={expandedHandle.toggle}>
					<Group
						py="sm"
						gap="sm"
					>
						<Text>{text}</Text>
						<Icon path={isExpanded ? iconChevronUp : iconChevronDown} />
					</Group>
				</UnstyledButton>
			</Group>
			<Collapse in={isExpanded}>
				<Paper
					bg={isLight ? "slate.0" : "slate.7"}
					p="md"
				>
					<SimpleGrid cols={3}>
						{data.map((item) => (
							<Checkbox
								key={item.value}
								label={item.label}
								checked={value.includes(item.value)}
								disabled={disabled}
								onChange={(e) => updateSelection(e, item.value)}
							/>
						))}
					</SimpleGrid>
				</Paper>
			</Collapse>
		</Box>
	);
}

function GranularCapability({
	name,
	description,
	value,
	what,
	disabled,
	onChange,
}: CapabilityProps<{ base: boolean; overrides: string[] }> & { what: string }) {
	const isLight = useIsLight();
	const [isExpanded, expandedHandle] = useBoolean();
	const [override, setOverride] = useInputState("");

	const setBase = useStable((base: boolean) => {
		onChange({ ...value, base });
	});

	const addOverride = useStable(() => {
		if (override && !value.overrides.includes(override)) {
			onChange({
				...value,
				overrides: [...value.overrides, override],
			});
		}

		setOverride("");
	});

	return (
		<Box>
			<Group
				gap="xs"
				mih={36}
			>
				<Text
					fz="lg"
					fw={500}
					c="bright"
				>
					{name}
				</Text>
				{description && (
					<Tooltip label={description}>
						<div>
							<Icon
								path={iconHelp}
								size="sm"
							/>
						</div>
					</Tooltip>
				)}
				<Spacer />
				<UnstyledButton onClick={expandedHandle.toggle}>
					<Group
						py="sm"
						gap="sm"
					>
						<Text>
							{value.base ? "Enabled" : "Disabled"}
							{value.overrides.length > 0 && `, ${value.overrides.length} exceptions`}
						</Text>

						<Icon path={isExpanded ? iconChevronUp : iconChevronDown} />
					</Group>
				</UnstyledButton>
			</Group>
			<Collapse in={isExpanded}>
				<Paper
					bg={isLight ? "slate.0" : "slate.7"}
					p="md"
				>
					<SimpleGrid cols={2}>
						<Button
							color="red"
							disabled={disabled}
							variant={value.base ? "transparent" : "light"}
							leftSection={<Icon path={iconCancel} />}
							onClick={() => setBase(false)}
							c={disabled ? undefined : isLight ? "red.8" : "red.4"}
						>
							Deny all {what}
						</Button>
						<Button
							color="green"
							disabled={disabled}
							variant={value.base ? "light" : "transparent"}
							leftSection={<Icon path={iconCheck} />}
							onClick={() => setBase(true)}
							c={disabled ? undefined : isLight ? "green.8" : "green.4"}
						>
							Allow all {what}
						</Button>
					</SimpleGrid>
					<Label mt="xl">{value.base ? "Denied" : "Allowed"} exceptions</Label>
					<Form onSubmit={addOverride}>
						<Group mt="md">
							<TextInput
								flex={1}
								size="xs"
								value={override}
								onChange={setOverride}
								disabled={disabled}
							/>
							<Button
								type="submit"
								size="xs"
								variant="gradient"
								disabled={disabled || !override}
								rightSection={<Icon path={iconPlus} />}
							>
								Add exception
							</Button>
						</Group>
					</Form>
					{value.overrides.length > 0 && (
						<List mt="md">
							{value.overrides.map((override) => (
								<List.Item
									key={override}
									icon={
										<ActionIcon
											color="slate"
											size="xs"
											variant="transparent"
											onClick={() =>
												onChange({
													...value,
													overrides: value.overrides.filter(
														(item) => item !== override,
													),
												})
											}
										>
											<Icon
												path={iconClose}
												size="sm"
											/>
										</ActionIcon>
									}
								>
									{override}
								</List.Item>
							))}
						</List>
					)}
				</Paper>
			</Collapse>
		</Box>
	);
}
