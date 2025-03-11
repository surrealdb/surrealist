import {
	Box,
	Group,
	UnstyledButton,
	Collapse,
	Paper,
	SimpleGrid,
	Text,
	Tooltip,
	Stack,
} from "@mantine/core";

import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useIsLight } from "~/hooks/theme";
import {
	iconHelp,
	iconChevronUp,
	iconChevronDown,
	iconCancel,
	iconCheck,
	iconWrench,
} from "~/util/icons";
import { useEffect, useLayoutEffect, useState } from "react";
import { Label } from "~/components/Label";
import { plural } from "~/util/helpers";
import { Selectable } from "~/types";

import {
	BASE_STATUS,
	BaseValue,
	CapabilityBaseProps,
	CapabilityField,
	isWildcard,
	RuleSetBase,
	SwitchGrid,
} from "./shared";
import { set } from "date-fns";
import { fork } from "radash";

export interface FixedRuleSetCapabilityProps extends CapabilityBaseProps {
	allowedField: CapabilityField;
	deniedField: CapabilityField;
	data: Selectable[];
	topic: string;
}

export function FixedRuleSetCapability({
	name,
	description,
	value,
	onChange,
	allowedField,
	deniedField,
	data,
	topic,
}: FixedRuleSetCapabilityProps) {
	const isLight = useIsLight();
	const [isExpanded, expandedHandle] = useBoolean();

	const allowed = value[allowedField] as string[];
	const denied = value[deniedField] as string[];

	let defaultBase: BaseValue;
	let defaulList: string[];

	if (denied.length === 0 && allowed.length > 0) {
		defaultBase = "denied";
		defaulList = allowed;
	} else {
		defaultBase = "allowed";
		defaulList = denied;
	}

	const [base, setBase] = useState<BaseValue>(defaultBase);
	const [list, setList] = useState<string[]>(defaulList);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Do not question it
	useEffect(() => {
		const dataValues = data.map((item) => item.value);
		const [checked, unchecked] = fork(dataValues, (item) => list.includes(item));

		if (base === "allowed") {
			onChange({
				...value,
				[allowedField]: unchecked,
				[deniedField]: checked,
			});
		} else if (base === "denied") {
			onChange({
				...value,
				[allowedField]: checked,
				[deniedField]: unchecked,
			});
		}
	}, [base, list, allowedField, deniedField]);

	const listCount = list.length;
	const statuSuffix = listCount > 0 && ` (${listCount} ${plural(listCount, "exception")})`;

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
					<SimpleGrid cols={2}>
						<RuleSetBase
							color="green"
							icon={iconCheck}
							active={base}
							value="allowed"
							title="Allow all by default"
							onChange={setBase}
						/>
						<RuleSetBase
							color="red"
							icon={iconCancel}
							active={base}
							value="denied"
							title="Deny all by default"
							onChange={setBase}
						/>
					</SimpleGrid>

					<Label mt="xl">
						{base === "allowed" ? `Denied ${topic}` : `Allowed ${topic}`}
					</Label>
					<Stack>
						<SwitchGrid
							data={data}
							columns={3}
							value={list}
							onChange={setList}
						/>
					</Stack>
				</Paper>
			</Collapse>
		</Box>
	);
}
