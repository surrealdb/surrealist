import { ActionIcon, Stack, Textarea } from "@mantine/core";
import { mdiCheck, mdiClose } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { QUERY_STYLE } from "./helpers";

export interface PermissionInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

export function PermissionInput(props: PermissionInputProps) {
	return (
		<Textarea
			required
			minRows={2}
			label={props.label}
			placeholder="FULL"
			styles={QUERY_STYLE}
			value={props.value}
			rightSectionWidth={0}
			rightSection={
				<Stack spacing="xs" ml={45}>
					<ActionIcon
						color="green"
						title="Grant full access"
						onClick={() => props.onChange('FULL')}
					>
						<Icon path={mdiCheck} />
					</ActionIcon>
					<ActionIcon
						color="red.5"
						title="Reject all access"
						onClick={() => props.onChange('NONE')}
					>
						<Icon path={mdiClose} />
					</ActionIcon>
				</Stack>
			}
			onChange={(e) => props.onChange(e.currentTarget.value)}
		/>
	)
}