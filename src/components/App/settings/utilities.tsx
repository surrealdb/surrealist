import { Stack, Title } from "@mantine/core";
import { PropsWithChildren, ReactNode } from "react";

export function SettingsSection({ label, children }: PropsWithChildren<{ label?: ReactNode }>) {
	return (
		<Stack gap="md">
			{label && (
				<Title order={2} c="bright" size={18}>
					{label}
				</Title>
			)}
			{children}
		</Stack>
	);
}