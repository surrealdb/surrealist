import {
	Box,
	Collapse,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";

import { useEffect, useState } from "react";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useIsLight } from "~/hooks/theme";
import { Selectable } from "~/types";
import { plural } from "~/util/helpers";
import {
	iconCancel,
	iconCheck,
	iconChevronDown,
	iconChevronUp,
	iconHelp,
	iconReset,
} from "~/util/icons";

import {
	BASE_STATUS,
	BaseValue,
	CapabilityBaseProps,
	CapabilityField,
	isWildcard,
	RuleSetBase,
	SwitchGrid,
} from "./shared";

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
	let defaultList: string[];

	if (isWildcard(allowed) && !isWildcard(denied)) {
		defaultBase = "allowed";
		defaultList = denied;
	} else if (!isWildcard(allowed) && isWildcard(denied)) {
		defaultBase = "denied";
		defaultList = allowed;
	} else {
		defaultBase = "default";
		defaultList = [];
	}

	const [base, setBase] = useState<BaseValue>(defaultBase);
	const [list, setList] = useState<string[]>(defaultList);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Do not question it
	useEffect(() => {
		const dataValues = data.map((item) => item.value);
		const enabled = dataValues.filter((item) => list.includes(item));

		if (base === "default") {
			onChange({
				...value,
				[allowedField]: [],
				[deniedField]: [],
			});
		} else if (base === "allowed") {
			onChange({
				...value,
				[allowedField]: ["*"],
				[deniedField]: enabled,
			});
		} else if (base === "denied") {
			onChange({
				...value,
				[allowedField]: enabled,
				[deniedField]: ["*"],
			});
		}
	}, [base, list, allowedField, deniedField]);

	const listCount = base === "default" ? 0 : list.length;
	const statuSuffix = listCount > 0 && ` (${listCount} ${plural(listCount, "exception")})`;

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
							{statuSuffix}
						</Text>

						<Icon path={isExpanded ? iconChevronUp : iconChevronDown} />
					</Group>
				</Group>
			</UnstyledButton>
			<Collapse in={isExpanded}>
				<Paper
					bg={isLight ? "slate.0" : "slate.7"}
					p="md"
				>
					<SimpleGrid cols={3}>
						<RuleSetBase
							color="orange"
							icon={iconReset}
							active={base}
							value="default"
							title="Managed defaults"
							onChange={setBase}
						/>
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

					{base !== "default" && (
						<>
							<Divider mt="md" />
							<Label mt="xl">
								{base === "allowed"
									? `Deny these ${topic}`
									: `Allow these ${topic}`}
							</Label>
							<Stack mt="sm">
								<SwitchGrid
									data={data}
									columns={3}
									value={list}
									onChange={setList}
								/>
							</Stack>
						</>
					)}
				</Paper>
			</Collapse>
		</Box>
	);
}
