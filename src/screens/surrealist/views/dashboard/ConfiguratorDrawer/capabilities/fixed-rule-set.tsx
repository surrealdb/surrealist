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
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { CapabilityBaseProps, CapabilityField } from "./shared";

import {
	iconHelp,
	iconChevronUp,
	iconChevronDown,
	iconCancel,
	iconCheck,
	iconWrench,
	iconPlus,
} from "~/util/icons";
import { Selectable } from "~/types";

export interface FixedRuleSetCapabilityProps extends CapabilityBaseProps {
	allowedField: CapabilityField;
	deniedField: CapabilityField;
	data: Selectable[];
}

export function FixedRuleSetCapability({
	name,
	description,
	value,
	disabled,
	onChange,
	allowedField,
	deniedField,
}: FixedRuleSetCapabilityProps) {
	const isLight = useIsLight();
	const [isExpanded, expandedHandle] = useBoolean();
	const [override, setOverride] = useInputState("");

	const setBase = useStable((base: boolean) => {
		// onChange({ ...value, base });
	});

	const addOverride = useStable(() => {
		// if (override && !value.overrides.includes(override)) {
		// 	onChange({
		// 		...value,
		// 		overrides: [...value.overrides, override],
		// 	});
		// }
		// setOverride("");
	});

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
						<Button
							color="red"
							disabled={disabled}
							// variant={value.base ? "transparent" : "light"}
							leftSection={<Icon path={iconCancel} />}
							onClick={() => setBase(false)}
							c={disabled ? undefined : isLight ? "red.8" : "red.4"}
						>
							{/* Deny all {what} */}
						</Button>
						<Button
							color="green"
							disabled={disabled}
							// variant={value.base ? "light" : "transparent"}
							leftSection={<Icon path={iconCheck} />}
							onClick={() => setBase(true)}
							c={disabled ? undefined : isLight ? "green.8" : "green.4"}
						>
							{/* Allow all {what} */}
						</Button>
						<Button
							color="slate"
							disabled={disabled}
							// variant={value.base ? "light" : "transparent"}
							leftSection={<Icon path={iconWrench} />}
							onClick={() => setBase(true)}
							c={disabled ? undefined : isLight ? "slate.7" : "slate.3"}
						>
							Granular control
						</Button>
					</SimpleGrid>
					{/* <Label mt="xl">{value.base ? "Denied" : "Allowed"} exceptions</Label> */}
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
