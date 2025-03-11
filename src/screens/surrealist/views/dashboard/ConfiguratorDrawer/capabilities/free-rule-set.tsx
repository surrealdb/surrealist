import {
	Box,
	Group,
	UnstyledButton,
	Collapse,
	Paper,
	SimpleGrid,
	Button,
	TextInput,
	Text,
	Tooltip,
	Stack,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { BaseValue, CapabilityBaseProps, CapabilityField, RuleSetBase } from "./shared";

import {
	iconHelp,
	iconChevronUp,
	iconChevronDown,
	iconCancel,
	iconCheck,
	iconWrench,
	iconPlus,
} from "~/util/icons";
import { useLayoutEffect, useState } from "react";
import { Label } from "~/components/Label";

export interface FreeRuleSetCapabilityProps extends CapabilityBaseProps {
	allowedField: CapabilityField;
	deniedField: CapabilityField;
	what: string;
}

export function FreeRuleSetCapability({
	name,
	description,
	value,
	what,
	disabled,
	onChange,
	allowedField,
	deniedField,
}: FreeRuleSetCapabilityProps) {
	const isLight = useIsLight();
	const [isExpanded, expandedHandle] = useBoolean();

	const [base, setBase] = useState<BaseValue>("allowed");
	const [allowlist, setAllowlist] = useState<string[]>([""]);
	const [denylist, setDenylist] = useState<string[]>([""]);

	const allowed = value[allowedField] as string[];
	const denied = value[deniedField] as string[];

	useLayoutEffect(() => {
		if (isWildcard(allowed) && !isWildcard(denied)) {
			setBase("allowed");
			setDenylist(denied);
		} else if (!isWildcard(allowed) && isWildcard(denied)) {
			setBase("denied");
			setAllowlist(allowed);
		} else {
			setBase("granular");
			setAllowlist(allowed);
			setDenylist(denied);
		}
	}, [allowed, denied]);

	const showAllowed = base === "denied" || base === "granular";
	const showDenied = base === "allowed" || base === "granular";

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
							{/* {value.base ? "Enabled" : "Disabled"}
							{value.overrides.length > 0 && `, ${value.overrides.length} exceptions`} */}
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
							color="red"
							icon={iconCancel}
							active={base}
							value="denied"
							title="Deny all by default"
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
								{allowlist.map((rule, i) => (
									<TextInput key={i} />
								))}
							</Stack>
						</>
					)}

					{showDenied && (
						<>
							<Label mt="xl">Denied rules</Label>
							<Stack>
								<TextInput />
							</Stack>
						</>
					)}

					{/* <Form onSubmit={addOverride}>
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
					{/* {value.overrides.length > 0 && (
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
					)} */}
				</Paper>
			</Collapse>
		</Box>
	);
}

function isWildcard(value: string[]) {
	return value.length === 1 && value[0] === "*";
}
