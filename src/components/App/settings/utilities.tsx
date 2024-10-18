import { type BoxProps, Stack, Title } from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";

export interface SettingsSectionProps extends BoxProps {
	label?: ReactNode;
}

export function SettingsSection({
	label,
	children,
	...other
}: PropsWithChildren<SettingsSectionProps>) {
	return (
		<Stack
			gap="md"
			{...other}
		>
			{label && (
				<Title
					order={2}
					c="bright"
					size={18}
				>
					{label}
				</Title>
			)}
			{children}
		</Stack>
	);
}
