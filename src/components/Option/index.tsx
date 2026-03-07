import { BoxProps, Checkbox, UnstyledButton } from "@mantine/core";
import { FC } from "react";
import classes from "./style.module.scss";

export interface OptionProps extends BoxProps {
	label: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (value: boolean) => void;
}

export const Option: FC<OptionProps> = ({ label, checked, disabled, onChange, ...other }) => (
	<UnstyledButton
		onClick={() => onChange(!checked)}
		disabled={disabled}
		mod={{ checked, disabled }}
		className={classes.root}
		{...other}
	>
		<Checkbox
			label={label}
			checked={checked}
			disabled={disabled}
			readOnly
			tabIndex={-1}
			styles={{ root: { pointerEvents: "none" } }}
		/>
	</UnstyledButton>
);
