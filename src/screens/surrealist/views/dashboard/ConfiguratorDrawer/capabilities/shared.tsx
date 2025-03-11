import { Button, MantineColor } from "@mantine/core";
import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { CloudInstanceCapabilities } from "~/types";

export type CapabilityField = keyof CloudInstanceCapabilities;
export type BaseValue = "allowed" | "denied" | "granular";

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

export function RuleSetBase({ color, icon, active, value, title, onChange }: RuleSetBaseProps) {
	return (
		<Button
			color={color}
			variant={active === value ? "light" : "transparent"}
			leftSection={<Icon path={icon} />}
			onClick={() => onChange(value)}
			c={color}
		>
			{title}
		</Button>
	);
}
