import {
	Box,
	Collapse,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";

import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useIsLight } from "~/hooks/theme";
import {
	BASE_STATUS,
	BaseValue,
	CapabilityBaseProps,
	CapabilityField,
	DynamicInputList,
	RuleSetBase,
	isWildcard,
} from "./shared";

import {
	iconCancel,
	iconCheck,
	iconChevronDown,
	iconChevronUp,
	iconHelp,
	iconWrench,
} from "~/util/icons";

import { useEffect, useState } from "react";
import { Label } from "~/components/Label";
import { plural } from "~/util/helpers";

export interface FreeRuleSetCapabilityProps extends CapabilityBaseProps {
	allowedField: CapabilityField;
	deniedField: CapabilityField;
	topic: string;
}

export function FreeRuleSetCapability({
	name,
	description,
	value,
	onChange,
	allowedField,
	deniedField,
	topic,
}: FreeRuleSetCapabilityProps) {
	const isLight = useIsLight();
	const [isExpanded, expandedHandle] = useBoolean();

	const allowed = value[allowedField] as string[];
	const denied = value[deniedField] as string[];

	let defaultBase: BaseValue;
	let defaultAllowList: string[];
	let defaultDenyList: string[];

	if (isWildcard(allowed) && !isWildcard(denied)) {
		defaultBase = "allowed";
		defaultAllowList = [];
		defaultDenyList = denied;
	} else if (!isWildcard(allowed) && isWildcard(denied)) {
		defaultBase = "denied";
		defaultAllowList = allowed;
		defaultDenyList = [];
	} else {
		defaultBase = "granular";
		defaultAllowList = allowed;
		defaultDenyList = denied;
	}

	const [base, setBase] = useState<BaseValue>(defaultBase);
	const [allowlist, setAllowlist] = useState<string[]>(defaultAllowList);
	const [denylist, setDenylist] = useState<string[]>(defaultDenyList);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Do not question it
	useEffect(() => {
		if (base === "allowed") {
			onChange({
				...value,
				[allowedField]: ["*"],
				[deniedField]: denylist,
			});
		} else if (base === "denied") {
			onChange({
				...value,
				[allowedField]: allowlist,
				[deniedField]: ["*"],
			});
		} else {
			onChange({
				...value,
				[allowedField]: allowlist,
				[deniedField]: denylist,
			});
		}
	}, [base, allowlist, denylist, allowedField, deniedField]);

	const showAllowed = base === "denied" || base === "granular";
	const showDenied = base === "allowed" || base === "granular";

	const allowCount = allowlist.length;
	const denyCount = denylist.length;

	const exceptions = base === "allowed" ? denyCount : base === "denied" ? allowCount : 0;
	const statusSuffix = exceptions > 0 && ` (${exceptions} ${plural(exceptions, "exception")})`;

	return (
		<Box>
			<UnstyledButton
				onClick={expandedHandle.toggle}
				w="100%"
			>
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
					<Group
						py="sm"
						gap="sm"
					>
						<Text>
							{BASE_STATUS[base]}
							{statusSuffix}
						</Text>

						<Icon path={isExpanded ? iconChevronUp : iconChevronDown} />
					</Group>
				</Group>
			</UnstyledButton>
			<Collapse in={isExpanded}>
				<Box pt="xs">
					<SimpleGrid cols={3}>
						<RuleSetBase
							color="blue"
							icon={iconWrench}
							active={base}
							value="granular"
							title="Granular control"
							onChange={setBase}
						/>
						<RuleSetBase
							color="green"
							icon={iconCheck}
							active={base}
							value="allowed"
							title="Allow by default"
							onChange={setBase}
						/>
						<RuleSetBase
							color="red"
							icon={iconCancel}
							active={base}
							value="denied"
							title="Deny by default"
							onChange={setBase}
						/>
					</SimpleGrid>

					<Paper
						my="xl"
						bg={isLight ? "slate.0" : "slate.7"}
						p="md"
					>
						<Stack>
							{showAllowed && (
								<Box>
									<Label>Allowed {topic} patterns</Label>
									<Stack>
										<DynamicInputList
											value={allowlist}
											onChange={setAllowlist}
											ghostProps={{
												placeholder: "Add allowed rule",
											}}
										/>
									</Stack>
								</Box>
							)}

							{showDenied && (
								<Box>
									<Label>Denied {topic} patterns</Label>
									<Stack>
										<DynamicInputList
											value={denylist}
											onChange={setDenylist}
											ghostProps={{
												placeholder: "Add denied rule",
											}}
										/>
									</Stack>
								</Box>
							)}
						</Stack>
					</Paper>
				</Box>
			</Collapse>
		</Box>
	);
}
