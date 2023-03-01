import { ActionIcon, Group, TextInput } from "@mantine/core";
import { mdiCancel, mdiCheck } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { QUERY_STYLE } from "./helpers";

export interface PermissionInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

export function PermissionInput(props: PermissionInputProps) {
	return (
		<TextInput
			required
			label={props.label}
			styles={QUERY_STYLE}
			value={props.value}
			rightSectionWidth={122}
			rightSection={
				<Group spacing="xs" ml={45}>
					<ActionIcon
						color="green"
						title="Grant full access"
						onClick={() => props.onChange('FULL')}
						variant={props.value.toUpperCase() === 'FULL' ? 'light' : 'subtle'}
					>
						<Icon path={mdiCheck} />
					</ActionIcon>
					<ActionIcon
						color="red.5"
						title="Reject all access"
						onClick={() => props.onChange('NONE')}
						variant={props.value.toUpperCase() === 'NONE' ? 'light' : 'subtle'}
					>
						<Icon path={mdiCancel} />
					</ActionIcon>
				</Group>
			}
			onChange={(e) => props.onChange(e.currentTarget.value)}
		/>
	)
}