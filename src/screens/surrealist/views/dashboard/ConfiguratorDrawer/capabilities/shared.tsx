import { Button, Checkbox, CheckboxProps, MantineColor, SimpleGrid } from "@mantine/core";
import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import { CodeInput, CodeInputProps } from "~/components/Inputs";
import { useStable } from "~/hooks/stable";
import { CloudInstanceCapabilities, Selectable } from "~/types";
import { iconCancel, iconCheck } from "~/util/icons";

export type CapabilityField = keyof CloudInstanceCapabilities;
export type BaseValue = "default" | "allowed" | "denied" | "granular";

export const BASE_STATUS: Record<BaseValue, string> = {
	default: "Default",
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
			color="slate"
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
	inputProps?: Partial<CodeInputProps>;
	ghostProps?: Partial<CodeInputProps>;
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
		<CodeInput
			key={index}
			value={item}
			{...(index === value.length ? ghostProps : inputProps)}
			onChange={(change) => handleUpdate(change, index)}
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
		path={iconCancel}
		size={0.85}
		{...others}
	/>
);

const AllowIcon: CheckboxProps["icon"] = ({ indeterminate, ...others }) => (
	<Icon
		path={iconCheck}
		size={0.85}
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
						key={option.value}
						checked={checked}
						disabled={disabled}
						label={option.label}
						color="red"
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
