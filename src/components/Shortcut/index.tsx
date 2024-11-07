import {
	iconCommand,
	iconKeyboardControl,
	iconKeyboardOption,
	iconKeyboardShift,
} from "~/util/icons";

import { type BoxProps, Group, Kbd, Text } from "@mantine/core";
import { capitalize } from "radash";
import { Fragment, type ReactNode, useMemo } from "react";
import { adapter } from "~/adapter";
import { beautifyKey, expandMetaKey, expandModKey } from "~/providers/Commands/keybindings";
import { Icon } from "../Icon";

export interface ShortcutProps extends Omit<BoxProps, "children"> {
	value: string[];
}

export function Shortcut({ value, ...rest }: ShortcutProps) {
	const content = useMemo(() => {
		const parts: ReactNode[] = value.map((part, i) => {
			return <Fragment key={i}>{displayKey(expandMetaKey(expandModKey(part)))}</Fragment>;
		});

		return parts;
	}, [value]);

	return (
		<Group
			gap={4}
			wrap="nowrap"
			{...rest}
		>
			{content.map((part, i) => (
				<Kbd
					key={i}
					p={0}
					px={4}
					miw={24}
					h={24}
					ta="center"
				>
					{part}
				</Kbd>
			))}
		</Group>
	);
}

function displayKey(key: string) {
	const isMac = adapter.platform === "darwin";

	switch (key) {
		case "command": {
			return (
				<Icon
					path={iconCommand}
					size={0.7}
				/>
			);
		}
		case "alt": {
			return isMac ? (
				<Icon
					path={iconKeyboardOption}
					size={0.7}
				/>
			) : (
				<Text>Alt</Text>
			);
		}
		case "ctrl": {
			return isMac ? (
				<Icon
					path={iconKeyboardControl}
					size={0.7}
				/>
			) : (
				<Text>Ctrl</Text>
			);
		}
		case "shift": {
			return (
				<Icon
					path={iconKeyboardShift}
					size={0.7}
				/>
			);
		}
		default: {
			return <Text fz="lg">{capitalize(beautifyKey(key))}</Text>;
		}
	}
}
