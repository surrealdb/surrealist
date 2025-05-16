import equal from "fast-deep-equal";
import classes from "../style.module.scss";

import {
	ARBITRARY_QUERY_TARGETS,
	ENDPOINT_TARGETS,
	EXPERIMENT_TARGETS,
	RPC_TARGETS,
} from "../capabilities/registry";

import { Box, Button, Divider, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { compareVersions } from "compare-versions";
import { useMemo, useState } from "react";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceCapabilitiesMutation } from "~/cloud/mutations/capabilities";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudInstanceCapabilities, Selectable } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { BooleanCapability } from "../capabilities/boolean";
import { FixedRuleSetCapability } from "../capabilities/fixed-rule-set";
import { FreeRuleSetCapability } from "../capabilities/free-rule-set";

export interface ConfigurationCapabilitiesProps {
	instance: CloudInstance;
	onClose: () => void;
}

export function ConfigurationCapabilities({ instance, onClose }: ConfigurationCapabilitiesProps) {
	const [{ network_access_caps }] = useFeatureFlags();
	const [value, setValue] = useState<CloudInstanceCapabilities>(
		parseCapabilities(instance.capabilities),
	);

	const hasArbitraryQuery = compareVersions(instance.version, "2.2.0") >= 0;

	const { mutateAsync } = useUpdateInstanceCapabilitiesMutation(instance.id);
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const handleUpdate = useStable(() => {
		confirmUpdate(transformCapabilities(value));
		onClose();
	});

	const isUnchanged = useMemo(() => {
		return equal(value, instance.capabilities);
	}, [value, instance.capabilities]);

	const experimentTargets = useMemo(
		() => filterOptions(EXPERIMENT_TARGETS, instance.version),
		[instance.version],
	);

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
							data={RPC_TARGETS}
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
							data={ENDPOINT_TARGETS}
							name="HTTP endpoints"
							description="Select which HTTP endpoints are available for use"
							value={value}
							onChange={setValue}
							allowedField="allowed_http_endpoints"
							deniedField="denied_http_endpoints"
							topic="endpoints"
						/>

						{network_access_caps && (
							<>
								<Divider />

								<FreeRuleSetCapability
									name="Network access"
									description="Configure outbound network access to specific targets"
									value={value}
									onChange={setValue}
									allowedField="allowed_networks"
									deniedField="denied_networks"
									topic="network"
								/>
							</>
						)}

						<Divider />

						<FreeRuleSetCapability
							name="Functions"
							description="Configure enabled functions for use in queries"
							value={value}
							onChange={setValue}
							allowedField="allowed_functions"
							deniedField="denied_functions"
							topic="function"
						/>

						{hasArbitraryQuery && (
							<>
								<Divider />

								<FixedRuleSetCapability
									data={ARBITRARY_QUERY_TARGETS}
									name="Arbitrary queries"
									description="Enable experimental SurrealDB functionality"
									value={value}
									onChange={setValue}
									allowedField="allowed_arbitrary_query"
									deniedField="denied_arbitrary_query"
									topic="targets"
								/>
							</>
						)}

						<Divider />

						<FixedRuleSetCapability
							data={experimentTargets}
							name="Preview features"
							description="Enable experimental SurrealDB functionality"
							value={value}
							onChange={setValue}
							allowedField="allowed_experimental"
							deniedField="denied_experimental"
							topic="previews"
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

	if (!endpoints.has("*")) {
		endpoints.add("health");
		endpoints.add("rpc");
	}

	if (!functions.has("*")) {
		functions.add("type::is::array");
	}

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

	functions.delete("type::is::array");

	return {
		...capabilities,
		allowed_http_endpoints: [...endpoints],
		allowed_functions: [...functions],
	};
}

type Option = Selectable & { since?: string };

function filterOptions(options: Option[], version: string) {
	return options.filter((option) => {
		if (!option.since) {
			return true;
		}

		return compareVersions(version, option.since) >= 0;
	});
}
