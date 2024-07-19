import { Stack, Group, Title } from "@mantine/core";
import { PropsWithChildren } from "react";

export interface CloudPageProps {
	title: string;
}

export function CloudPage({ title, children }: PropsWithChildren<CloudPageProps>) {
	return (
		<Stack flex={1}>
			<Group gap="xs">
				<Title
					c="bright"
					fz={32}
					pt={38}
					pb={16}
				>
					{title}
				</Title>
			</Group>
			{children}
		</Stack>
	);
}