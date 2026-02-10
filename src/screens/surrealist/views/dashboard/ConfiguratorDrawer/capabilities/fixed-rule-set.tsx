import {
	Box,
	Collapse,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Text,
	ThemeIcon,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { useEffect, useState } from "react";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useIsLight } from "~/hooks/theme";
import { Selectable } from "~/types";
import { plural } from "~/util/helpers";
import { iconCancel, iconCheck, iconChevronDown, iconChevronUp, iconHelp } from "~/util/icons";

import {
	BASE_STATUS,
	BaseValue,
	CapabilityBaseProps,
	CapabilityField,
	CheckboxGrid,
	isWildcard,
	RuleSetBase,
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

	if (isWildcard(allowed)) {
		defaultBase = "allowed";
		defaultList = denied;
	} else {
		defaultBase = "denied";
		defaultList = allowed;
	}

	const [base, setBase] = useState<BaseValue>(defaultBase);
	const [list, setList] = useState<string[]>(defaultList);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Do not question it
	useEffect(() => {
		const dataValues = data.map((item) => item.value);
		const enabled = dataValues.filter((item) => list.includes(item));

		if (base === "allowed") {
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

	const statusSuffix = list.length > 0 && ` (${list.length} ${plural(list.length, "exception")})`;
	const noteIcon = base === "allowed" ? iconCancel : iconCheck;

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

					<Paper
						my="xl"
						bg={isLight ? "slate.0" : "slate.7"}
						p="md"
					>
						<Group>
							<ThemeIcon
								radius="xs"
								size="lg"
								color="slate"
								variant="light"
							>
								<Icon path={noteIcon} />
							</ThemeIcon>
							<Box>
								<Text
									fw={600}
									c="bright"
								>
									Configure {base === "allowed" ? "denied" : "allowed"} {topic}
								</Text>
								<Text>
									Select individual {topic} to{" "}
									{base === "allowed" ? "deny" : "allow"}
								</Text>
							</Box>
						</Group>
						<Divider my="md" />
						<Box p={4}>
							<CheckboxGrid
								data={data}
								columns={4}
								value={list}
								base={base}
								onChange={setList}
							/>
						</Box>
					</Paper>
				</Box>
			</Collapse>
		</Box>
	);
}
