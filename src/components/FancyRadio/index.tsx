import { Radio, type RadioProps, Text } from "@mantine/core";
import { Icon } from "@surrealdb/ui";

export interface FancyRadioProps extends RadioProps {
	title: string;
	titleIcon?: string;
	subtitle?: string;
}

export const FancyRadio = ({ title, titleIcon, subtitle, ...props }: FancyRadioProps) => {
	const label = (
		<>
			<Text
				style={{ display: "flex", alignItems: "center" }}
				size="md"
			>
				{titleIcon && (
					<Icon
						path={titleIcon}
						size="sm"
					/>
				)}
				{title}
			</Text>
			{subtitle && <Text c="obsidian">{subtitle}</Text>}
		</>
	);

	return (
		<Radio
			label={label}
			{...props}
		/>
	);
};
