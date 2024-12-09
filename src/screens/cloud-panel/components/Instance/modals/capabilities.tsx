import classes from "../style.module.scss";

import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Checkbox,
	Collapse,
	Group,
	List,
	Paper,
	SegmentedControl,
	SimpleGrid,
	Switch,
	Text,
	TextInput,
	UnstyledButton,
} from "@mantine/core";

import { Stack } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeAllModals, openModal } from "@mantine/modals";
import { ReactNode, useMemo, useState } from "react";
import { BetaBadge } from "~/components/BetaBadge";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { CloudInstance, Selection } from "~/types";
import { iconChevronDown, iconClose, iconPlus } from "~/util/icons";

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

export async function openCapabilitiesModal(instance: CloudInstance) {
	openModal({
		size: "lg",
		title: (
			<Box>
				<PrimaryTitle>Instance capabilities</PrimaryTitle>
				<Text fz="lg">{instance.name}</Text>
			</Box>
		),
		children: <CapabilitiesModal instance={instance} />,
	});
}

interface CapabilitiesModalProps {
	instance: CloudInstance;
}

function CapabilitiesModal({ instance }: CapabilitiesModalProps) {
	const isLight = useIsLight();

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
		<Stack>
			<Text mb="lg">
				You can configure the capabilities of this instance to control fine-grained access
				to individual features, functions, and endpoints.
			</Text>

			<Alert
				title="Note"
				color="blue"
			>
				The ability to configure instance capabilities is not currently available.
			</Alert>

			<Paper
				bg={isLight ? "slate.0" : "slate.9"}
				p="xl"
			>
				<Stack gap="xl">
					<BinaryCapability
						name="Scripting"
						description="Allow execution of embedded scripting functions"
						value={scripting}
						onChange={setScripting}
						disabled
					/>

					<BinaryCapability
						name="Guest Access"
						description="Allow non-authenticated users to execute queries when authentication is enabled"
						value={guestAccess}
						onChange={setGuestAccess}
						disabled
					/>

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

					<OptionsCapability
						data={rpcs}
						name="Enabled RPCs"
						description="Select which RPC methods are available for use"
						value={enabledRpcs}
						onChange={setEnabledRpcs}
						disabled
					/>

					<OptionsCapability
						data={endpoints}
						name="Enabled HTTP endpoints"
						description="Select which HTTP endpoints are available for use"
						value={enabledEndpoints}
						onChange={setEnabledEndpoints}
						disabled
					/>

					<GranularCapability
						name="Network access"
						description="Configure outbound network access to specific targets"
						what="network targets"
						value={networkAccess}
						onChange={setNetworkAccess}
						disabled
					/>

					<GranularCapability
						name="Functions"
						description="Configure enabled functions for use in queries"
						what="functions"
						value={functions}
						onChange={setFunctions}
						disabled
					/>
				</Stack>
			</Paper>

			<Group mt="md">
				<Button
					onClick={() => closeAllModals()}
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
					Save changes
				</Button>
			</Group>
		</Stack>
	);
}

export interface CapabilityProps<V> {
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
		<Group>
			<Box>
				<Text
					fz="lg"
					fw={500}
					c="bright"
				>
					{name}
				</Text>
				{description && (
					<Text
						fz="sm"
						c="slate"
					>
						{description}
					</Text>
				)}
			</Box>
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
}: CapabilityProps<string[]> & { data: Selection }) {
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
		<>
			<Group>
				<Box>
					<Text
						fz="lg"
						fw={500}
						c="bright"
					>
						{name}
					</Text>
					{description && (
						<Text
							fz="sm"
							c="slate"
						>
							{description}
						</Text>
					)}
				</Box>
				<Spacer />
				<UnstyledButton onClick={expandedHandle.toggle}>
					<Group
						py="sm"
						gap="sm"
					>
						<Text>{text}</Text>
						<Icon path={iconChevronDown} />
					</Group>
				</UnstyledButton>
			</Group>
			<Collapse in={isExpanded}>
				<Paper
					bd="1px solid var(--surrealist-divider-color)"
					bg="transparent"
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
		</>
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
	const [isExpanded, expandedHandle] = useBoolean();
	const [override, setOverride] = useInputState("");

	const setBase = useStable((base: string) => {
		onChange({
			...value,
			base: base === "allow",
		});
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
		<>
			<Group>
				<Box>
					<Text
						fz="lg"
						fw={500}
						c="bright"
					>
						{name}
					</Text>
					{description && (
						<Text
							fz="sm"
							c="slate"
						>
							{description}
						</Text>
					)}
				</Box>
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

						<Icon path={iconChevronDown} />
					</Group>
				</UnstyledButton>
			</Group>
			<Collapse in={isExpanded}>
				<Paper
					bd="1px solid var(--surrealist-divider-color)"
					bg="transparent"
					p="md"
				>
					<SegmentedControl
						fullWidth
						className={classes.whitelistSwitch}
						value={value.base ? "allow" : "deny"}
						onChange={setBase}
						disabled={disabled}
						data={[
							{
								label: `Allow all ${what}`,
								value: "allow",
							},
							{
								label: `Deny all ${what}`,
								value: "deny",
							},
						]}
					/>
					<Label mt="xl">
						Override and {value.base ? "deny" : "allow"} specific {what}
					</Label>
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
		</>
	);
}
