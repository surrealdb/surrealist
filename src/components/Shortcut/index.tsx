import { mdiAppleKeyboardCommand, mdiAppleKeyboardControl, mdiAppleKeyboardOption, mdiAppleKeyboardShift } from "@mdi/js";
import { BoxProps, Group, Kbd, Text } from "@mantine/core";
import { Fragment, ReactNode, useMemo } from "react";
import { adapter } from "~/adapter";
import { capitalize } from "radash";
import { Icon } from "../Icon";

export interface ShortcutProps extends Omit<BoxProps, 'children'> {
	value: string;
}

export function Shortcut({ value, ...rest }: ShortcutProps) {

	const content = useMemo(() => {
		const isMac = adapter.platform == "darwin";

		const parts: ReactNode[] = value.split(" ").map((part, i) => {
			let code: ReactNode = part;

			switch (part) {
				case "mod": {
					code = <Icon path={isMac ? mdiAppleKeyboardCommand : mdiAppleKeyboardControl} size={0.7} />;
					break;
				}
				case "alt": {
					code = isMac ? <Icon path={mdiAppleKeyboardOption} size={0.7} /> : <Text>Alt</Text>;
					break;
				}
				case "ctrl": {
					code = <Icon path={mdiAppleKeyboardControl} size={0.7} />;
					break;
				}
				case "shift": {
					code = <Icon path={mdiAppleKeyboardShift} size={0.7} />;
					break;
				}
				default: {
					code = <Text fz="lg">{capitalize(part)}</Text>;
					break;
				}
			}

			return (
				<Fragment key={i}>
					{code}
				</Fragment>
			);
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
				<Fragment key={i}>
					<Kbd p={0} px={4} miw={24} h={24} ta="center">
						{part}
					</Kbd>
					{i < content.length - 1 && <Text c="slate">+</Text>}
				</Fragment>
			))}
		</Group>
	);
}