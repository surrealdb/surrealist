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

import {
	iconCancel,
	iconCheck,
	iconChevronDown,
	iconChevronUp,
	iconClose,
	iconHelp,
	iconPlus,
	iconWrench,
} from "~/util/icons";

import { useInputState } from "@mantine/hooks";
import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import { BetaBadge } from "~/components/BetaBadge";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { CloudInstance, CloudInstanceCapabilities, Selectable } from "~/types";
import { useImmer } from "use-immer";
import { BooleanCapability } from "../capabilities/boolean";
import { FixedRuleSetCapability } from "../capabilities/fixed-rule-set";
import { FreeRuleSetCapability } from "../capabilities/free-rule-set";

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

export function ConfigurationCapabilities({ instance, onClose }: ConfigurationCapabilitiesProps) {
	const [value, setValue] = useState<CloudInstanceCapabilities>(instance.capabilities);

	console.log("capabilities", value);

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

						<BooleanCapability
							name="Scripting"
							description="Allow execution of embedded scripting functions"
							value={value}
							onChange={setValue}
							field="allow_scripting"
						/>

						<Divider />

						<BooleanCapability
							name="Guest Access"
							description="Allow non-authenticated users to execute queries when authentication is enabled"
							value={value}
							onChange={setValue}
							field="allow_guests"
						/>

						<Divider />

						<FixedRuleSetCapability
							data={rpcs}
							name="RPC methods"
							description="Select which RPC methods are available for use"
							value={value}
							onChange={setValue}
							allowedField="allowed_rpc_methods"
							deniedField="denied_rpc_methods"
						/>

						<Divider />

						<FixedRuleSetCapability
							data={endpoints}
							name="HTTP endpoints"
							description="Select which HTTP endpoints are available for use"
							value={value}
							onChange={setValue}
							allowedField="allowed_http_endpoints"
							deniedField="denied_http_endpoints"
						/>

						<Divider />

						<FreeRuleSetCapability
							name="Network access"
							description="Configure outbound network access to specific targets"
							what="network targets"
							value={value}
							onChange={setValue}
							allowedField="allowed_networks"
							deniedField="denied_networks"
						/>

						<Divider />

						<FreeRuleSetCapability
							name="Functions"
							description="Configure enabled functions for use in queries"
							what="functions"
							value={value}
							onChange={setValue}
							allowedField="allowed_functions"
							deniedField="denied_functions"
						/>

						<Divider />

						<FixedRuleSetCapability
							data={rpcs}
							name="Arbitrary queries"
							description="Enable experimental SurrealDB functionality"
							value={value}
							onChange={setValue}
							allowedField="allowed_arbitrary_query"
							deniedField="denied_arbitrary_query"
							disabled
						/>

						<Divider />

						<FixedRuleSetCapability
							data={rpcs}
							name="Preview features"
							description="Enable experimental SurrealDB functionality"
							value={value}
							onChange={setValue}
							allowedField="allowed_preview"
							deniedField="denied_preview"
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

// function OptionsCapability({
// 	name,
// 	description,
// 	value,
// 	data,
// 	disabled,
// 	onChange,
// }: CapabilityProps<string[]> & { data: Selectable[] }) {
// 	const isLight = useIsLight();
// 	const [isExpanded, expandedHandle] = useBoolean();

// 	const updateSelection = (event: React.ChangeEvent<HTMLInputElement>, item: string) => {
// 		const newValue = event.currentTarget.checked
// 			? [...value, item]
// 			: value.filter((selected) => selected !== item);

// 		onChange(newValue);
// 	};

// 	const text =
// 		value.length === data.length
// 			? "All enabled"
// 			: value.length === 0
// 				? "None enabled"
// 				: `${value.length} Enabled`;

// 	return (
// 		<Box>
// 			<Group
// 				gap="xs"
// 				mih={36}
// 			>
// 				<Text
// 					fz="lg"
// 					fw={500}
// 					c="bright"
// 				>
// 					{name}
// 				</Text>
// 				{description && (
// 					<Tooltip label={description}>
// 						<div>
// 							<Icon
// 								path={iconHelp}
// 								size="sm"
// 							/>
// 						</div>
// 					</Tooltip>
// 				)}
// 				<Spacer />
// 				<UnstyledButton onClick={expandedHandle.toggle}>
// 					<Group
// 						py="sm"
// 						gap="sm"
// 					>
// 						<Text>{text}</Text>
// 						<Icon path={isExpanded ? iconChevronUp : iconChevronDown} />
// 					</Group>
// 				</UnstyledButton>
// 			</Group>
// 			<Collapse in={isExpanded}>
// 				<Paper
// 					bg={isLight ? "slate.0" : "slate.7"}
// 					p="md"
// 				>
// 					<SimpleGrid cols={3}>
// 						{data.map((item) => (
// 							<Checkbox
// 								key={item.value}
// 								label={item.label}
// 								checked={value.includes(item.value)}
// 								disabled={disabled}
// 								onChange={(e) => updateSelection(e, item.value)}
// 							/>
// 						))}
// 					</SimpleGrid>
// 				</Paper>
// 			</Collapse>
// 		</Box>
// 	);
// }
