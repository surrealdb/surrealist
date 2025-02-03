import { Group, Kbd, KbdProps } from "@mantine/core";
import { displayBinding } from "~/providers/Commands/keybindings";

export interface ShortcutProps extends Omit<KbdProps, "children"> {
	value: string[];
}

export function Shortcut({ value, ...rest }: ShortcutProps) {
	return (
		<Kbd
			py={1}
			px="sm"
			{...rest}
		>
			<Group
				gap="xs"
				wrap="nowrap"
			>
				{displayBinding(value)}
			</Group>
		</Kbd>
	);
}
