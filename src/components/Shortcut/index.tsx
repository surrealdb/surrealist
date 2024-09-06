import { type BoxProps, Group, Kbd, Text } from "@mantine/core";
import { capitalize } from "radash";
import { Fragment, type ReactNode, useMemo } from "react";
import { adapter } from "~/adapter";
import {
	iconCommand,
	iconKeyboardControl,
	iconKeyboardOption,
	iconKeyboardShift,
} from "~/util/icons";
import { Icon } from "../Icon";

export interface ShortcutProps extends Omit<BoxProps, "children"> {
	value: string;
}

export function Shortcut({ value, ...rest }: ShortcutProps) {
	const content = useMemo(() => {
		const isMac = adapter.platform === "darwin";

		const parts: ReactNode[] = value.split(" ").map((part, i) => {
			let code: ReactNode = part;

			switch (part) {
				case "mod": {
					code = (
						<Icon
							path={isMac ? iconCommand : iconKeyboardControl}
							size={0.7}
						/>
					);
					break;
				}
				case "alt": {
					code = isMac ? (
						<Icon path={iconKeyboardOption} size={0.7} />
					) : (
						<Text>Alt</Text>
					);
					break;
				}
				case "ctrl": {
					code = <Icon path={iconKeyboardControl} size={0.7} />;
					break;
				}
				case "shift": {
					code = <Icon path={iconKeyboardShift} size={0.7} />;
					break;
				}
				default: {
					code = <Text fz="lg">{capitalize(part)}</Text>;
					break;
				}
			}

			return <Fragment key={i}>{code}</Fragment>;
		});

		return parts;
	}, [value]);

	return (
		<Group gap={4} wrap="nowrap" {...rest}>
			{content.map((part, i) => (
				<Kbd key={i} p={0} px={4} miw={24} h={24} ta="center">
					{part}
				</Kbd>
			))}
		</Group>
	);
}
