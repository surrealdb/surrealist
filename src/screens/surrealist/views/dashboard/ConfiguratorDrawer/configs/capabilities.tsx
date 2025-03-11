import equal from "fast-deep-equal";
import classes from "../style.module.scss";

import { Box, Button, Divider, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { useMemo, useState } from "react";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceCapabilitiesMutation } from "~/cloud/mutations/capabilities";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudInstanceCapabilities } from "~/types";
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
	const [value, setValue] = useState<CloudInstanceCapabilities>(
		parseCapabilities(instance.capabilities),
	);

	const { mutateAsync } = useUpdateInstanceCapabilitiesMutation(instance.id);
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const handleUpdate = useStable(() => {
		confirmUpdate(transformCapabilities(value));
		onClose();
	});

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

	const isUnchanged = useMemo(() => {
		return equal(value, instance.capabilities);
	}, [value, instance.capabilities]);

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
							topic="rpcs"
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
							topic="endpoints"
						/>

						<Divider />

						<FreeRuleSetCapability
							name="Network access"
							description="Configure outbound network access to specific targets"
							value={value}
							onChange={setValue}
							allowedField="allowed_networks"
							deniedField="denied_networks"
						/>

						<Divider />

						<FreeRuleSetCapability
							name="Functions"
							description="Configure enabled functions for use in queries"
							value={value}
							onChange={setValue}
							allowedField="allowed_functions"
							deniedField="denied_functions"
						/>

						<Divider />

						{/* <FixedRuleSetCapability
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
						/> */}
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
					disabled={isUnchanged}
					onClick={handleUpdate}
					flex={1}
				>
					Apply capabilities
				</Button>
			</Group>
		</Stack>
	);
}

function transformCapabilities(capabilities: CloudInstanceCapabilities): CloudInstanceCapabilities {
	const endpoints = new Set(capabilities.allowed_http_endpoints);
	const functions = new Set(capabilities.allowed_functions);

	endpoints.add("health");
	endpoints.add("rpc");

	// TODO remove
	functions.add("type::is::array");

	return {
		...capabilities,
		allowed_http_endpoints: [...endpoints],
		allowed_functions: [...functions],
	};
}

function parseCapabilities(capabilities: CloudInstanceCapabilities): CloudInstanceCapabilities {
	const endpoints = new Set(capabilities.allowed_http_endpoints);
	const functions = new Set(capabilities.allowed_functions);

	endpoints.delete("health");
	endpoints.delete("rpc");

	// TODO remove
	functions.delete("type::is::array");

	return {
		...capabilities,
		allowed_http_endpoints: [...endpoints],
		allowed_functions: [...functions],
	};
}
