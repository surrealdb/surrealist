import { Stack, Text, TextProps, Title } from "@mantine/core";
import { PropsWithChildren, ReactNode } from "react";

export function Label(props: PropsWithChildren<TextProps>) {
	return (
		<Text
			style={{ color: 'var(--mantine-color-text)' }}
			size="sm"
			fw={500}
		>
			{props.children}
		</Text>
	);
}

export function SettingsSection({ label, children }: PropsWithChildren<{ label?: ReactNode }>) {
	return (
		<Stack gap="sm">
			{label && (
				<Title order={2} c="bright" size={18}>
					{label}
				</Title>
			)}
			{children}
		</Stack>
	);
}