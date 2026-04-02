import {
	Button,
	Checkbox,
	type CheckboxProps,
	type MantineColor,
	SimpleGrid,
	TextInput,
	type TextInputProps,
} from "@mantine/core";
import { Icon, iconCancel, iconCheck, useStable } from "@surrealdb/ui";
import type { ReactNode } from "react";
import type { CloudInstanceCapabilities, Selectable } from "~/types";

export type CapabilityField = keyof CloudInstanceCapabilities;
export type BaseValue = "allowed" | "denied" | "granular";

export const BASE_STATUS: Record<BaseValue, string> = {
	allowed: "Allowed",
	denied: "Denied",
	granular: "Granular",
};

export function isWildcard(value: string[]) {
	return value.length === 1 && value[0] === "*";
}

export interface CapabilityBaseProps {
	name: ReactNode;
	disabled?: boolean;
	description?: ReactNode;
	value: CloudInstanceCapabilities;
	rightSection?: ReactNode;
	onChange: (value: CloudInstanceCapabilities) => void;
}

export interface RuleSetBaseProps {
	color: MantineColor;
	icon: string;
	active: BaseValue;
	value: BaseValue;
	title: string;
	onChange: (value: BaseValue) => void;
}

export function RuleSetBase({ icon, active, value, title, onChange }: RuleSetBaseProps) {
	return (
		<Button
			color="obsidian"
			variant={active === value ? "gradient" : "light"}
			leftSection={<Icon path={icon} />}
			onClick={() => onChange(value)}
		>
			{title}
		</Button>
	);
}

export interface DynamicInputListProps {
	value: string[];
	inputProps?: Partial<TextInputProps>;
	ghostProps?: Partial<TextInputProps>;
	onChange: (value: string[]) => void;
}

export function DynamicInputList({
	value,
	inputProps,
	ghostProps,
	onChange,
}: DynamicInputListProps) {
	const fullList = value.concat([""]);

	const handleUpdate = useStable((changed: string, index: number) => {
		if (index >= value.length) {
			onChange(value.concat(changed));
		} else {
			onChange(value.with(index, changed));
		}
	});

	return fullList.map((item, index) => (
		<TextInput
			key={index}
			value={item}
			{...(index === value.length ? ghostProps : inputProps)}
			onChange={(e) => handleUpdate(e.currentTarget.value, index)}
			onBlur={() => {
				if (item === "" && index !== value.length) {
					onChange(value.toSpliced(index, 1));
				}
			}}
		/>
	));
}

export interface CheckboxGridProps {
	data: Selectable[];
	value: string[];
	columns: number;
	disabled?: boolean;
	base: BaseValue;
	onChange: (value: string[]) => void;
}

const DenyIcon: CheckboxProps["icon"] = ({ indeterminate, ...others }) => (
	<Icon
		c="bright"
		path={iconCancel}
		size="xs"
		{...others}
	/>
);

const AllowIcon: CheckboxProps["icon"] = ({ indeterminate, ...others }) => (
	<Icon
		c="bright"
		path={iconCheck}
		size="xs"
		{...others}
	/>
);

const DENY_BG =
	"linear-gradient(135deg, var(--mantine-color-red-6) 0%, var(--mantine-color-red-8) 100%)";

export function CheckboxGrid({
	data,
	value,
	columns,
	disabled,
	base,
	onChange,
}: CheckboxGridProps) {
	return (
		<SimpleGrid
			cols={columns}
			spacing="sm"
		>
			{data.map((option) => {
				const checked = value.includes(option.value);

				return (
					<Checkbox
						variant="gradient"
						key={option.value}
						checked={checked}
						disabled={disabled}
						label={option.label}
						color={base === "allowed" ? "red" : undefined}
						icon={base === "allowed" ? DenyIcon : AllowIcon}
						onChange={(e) =>
							onChange(
								e.target.checked
									? value.concat(option.value)
									: value.toSpliced(value.indexOf(option.value), 1),
							)
						}
						styles={{
							input: {
								background: checked && base === "allowed" ? DENY_BG : undefined,
							},
						}}
					/>
				);
			})}
		</SimpleGrid>
	);
}
