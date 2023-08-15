import { Radio, RadioProps, Text } from "@mantine/core";
import { Icon } from "../Icon";

export interface FancyRadioProps extends RadioProps {
	title: string;
	titleIcon?: string;
	subtitle?: string;
}

export const FancyRadio = ({ title, titleIcon, subtitle, ...props }: FancyRadioProps) => {
	const label = (
		<>
			<Text style={{ display: "flex", alignItems: "center" }} size="md">
				{titleIcon && <Icon path={titleIcon} size="sm" left />}
				{title}
			</Text>
			{subtitle && <Text color="light.5">{subtitle}</Text>}
		</>
	);

	return <Radio label={label} {...props} />;
};
