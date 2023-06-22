import { Group } from "@mantine/core";
import { Spacer } from "../Spacer";
import { PropsWithChildren, ReactNode } from "react";
import { Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";

export interface SettingProps {
	label: ReactNode;
}

export function Setting(props: PropsWithChildren<SettingProps>) {
	const isLight = useIsLight();

	return (
		<Group>
			<Text color={isLight ? 'black' : 'gray.4'}>
				{props.label}
			</Text>
			<Spacer />
			{props.children}
		</Group>
	)
}