import { mdiAppleKeyboardCommand, mdiAppleKeyboardControl, mdiAppleKeyboardOption, mdiAppleKeyboardShift } from "@mdi/js";
import { Group, Kbd, KbdProps, Text } from "@mantine/core";
import { Fragment, ReactNode, useMemo } from "react";
import { adapter } from "~/adapter";
import { capitalize } from "radash";
import { Icon } from "../Icon";

export interface ShortcutProps extends Omit<KbdProps, 'children'> {
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
					code = <Text>{capitalize(part)}</Text>;
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
		<Kbd {...rest}>
			<Group gap="xs" wrap="nowrap">
				{content}
			</Group>
		</Kbd>
	);
}