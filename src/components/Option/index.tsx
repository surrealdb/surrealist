import { Box, BoxProps, Text, Transition, UnstyledButton } from "@mantine/core";
import { Icon, iconCheck } from "@surrealdb/ui";
import { FC, ReactNode } from "react";
import classes from "./style.module.scss";

export interface OptionProps extends BoxProps {
	label: string;
	checked: boolean;
	disabled?: boolean;
	icon?: ReactNode;
	onChange: (value: boolean) => void;
}

export const Option: FC<OptionProps> = ({ label, checked, disabled, icon, onChange, ...other }) => (
	<UnstyledButton
		onClick={() => onChange(!checked)}
		disabled={disabled}
		mod={{ checked, disabled }}
		className={classes.root}
		{...other}
	>
		{icon && (
			<Box
				opacity={0.75}
				fz="xs"
			>
				{icon}
			</Box>
		)}
		<Text
			flex={1}
			fw={500}
			c="bright"
		>
			{label}
		</Text>
		<Transition
			transition="scale"
			mounted={checked}
		>
			{(styles) => (
				<Box
					style={{
						...styles,
						transformOrigin: "center",
					}}
				>
					<Icon
						path={iconCheck}
						c="violet"
					/>
				</Box>
			)}
		</Transition>
	</UnstyledButton>
);
