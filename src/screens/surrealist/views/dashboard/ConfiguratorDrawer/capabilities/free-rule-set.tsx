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

import { useEffect, useLayoutEffect, useState } from "react";
import { Label } from "~/components/Label";
import { plural } from "~/util/helpers";

export interface FreeRuleSetCapabilityProps extends CapabilityBaseProps {
	allowedField: CapabilityField;
	deniedField: CapabilityField;
}

export function FreeRuleSetCapability({
	name,
	description,
	value,
	onChange,
	allowedField,
	deniedField,
}: FreeRuleSetCapabilityProps) {
	const isLight = useIsLight();
	const [isExpanded, expandedHandle] = useBoolean();

	const allowed = value[allowedField] as string[];
	const denied = value[deniedField] as string[];

	let defaultBase: BaseValue;
	let defaulAllowList: string[];
	let defaultDenyList: string[];

	if (isWildcard(allowed) && !isWildcard(denied)) {
		defaultBase = "allowed";
		defaulAllowList = [];
		defaultDenyList = denied;
	} else if (!isWildcard(allowed) && isWildcard(denied)) {
		defaultBase = "denied";
		defaulAllowList = allowed;
		defaultDenyList = [];
	} else {
		defaultBase = "granular";
		defaulAllowList = allowed;
		defaultDenyList = denied;
	}

	const [base, setBase] = useState<BaseValue>(defaultBase);
	const [allowlist, setAllowlist] = useState<string[]>(defaulAllowList);
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
	const statuSuffix = exceptions > 0 && ` (${exceptions} ${plural(exceptions, "exception")})`;

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
							{BASE_STATUS[base]}
							{statuSuffix}
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
					<SimpleGrid cols={3}>
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
						<RuleSetBase
							color="blue"
							icon={iconWrench}
							active={base}
							value="granular"
							title="Granular control"
							onChange={setBase}
						/>
					</SimpleGrid>

					{showAllowed && (
						<>
							<Label mt="xl">Allowed rules</Label>
							<Stack>
								<DynamicInputList
									value={allowlist}
									onChange={setAllowlist}
									ghostProps={{
										placeholder: "Add allowed rule",
									}}
								/>
							</Stack>
						</>
					)}

					{showDenied && (
						<>
							<Label mt="xl">Denied rules</Label>
							<Stack>
								<DynamicInputList
									value={denylist}
									onChange={setDenylist}
									ghostProps={{
										placeholder: "Add denied rule",
									}}
								/>
							</Stack>
						</>
					)}
				</Paper>
			</Collapse>
		</Box>
	);
}
