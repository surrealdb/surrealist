import { Button, Checkbox, MantineColor, SimpleGrid } from "@mantine/core";
import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import { CodeInput, CodeInputProps } from "~/components/Inputs";
import { useStable } from "~/hooks/stable";
import { CloudInstanceCapabilities, Selectable } from "~/types";
import { iconCheck, iconCloud } from "~/util/icons";

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
	onChange: (value: string[]) => void;
}

export function CheckboxGrid({ data, value, columns, disabled, onChange }: CheckboxGridProps) {
	return (
		<SimpleGrid
			cols={columns}
			spacing="sm"
		>
			{data.map((option) => (
				<Checkbox
					key={option.value}
					checked={value.includes(option.value)}
					disabled={disabled}
					label={option.label}
					variant="gradient"
					onChange={(e) =>
						onChange(
							e.target.checked
								? value.concat(option.value)
								: value.toSpliced(value.indexOf(option.value), 1),
						)
					}
				/>
			))}
		</SimpleGrid>
	);
}
