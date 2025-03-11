import { Group, Checkbox, Text, Tooltip, Switch } from "@mantine/core";
import { ChangeEvent } from "react";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { iconHelp } from "~/util/icons";
import { CapabilityBaseProps, CapabilityField } from "./shared";

export interface BooleanCapabilityProps extends CapabilityBaseProps {
	field: CapabilityField;
}

export function BooleanCapability({
	name,
	disabled,
	description,
	value,
	onChange,
	field,
}: BooleanCapabilityProps) {
	const checked = !!value[field];

	const handleChange = useStable((event: ChangeEvent<HTMLInputElement>) => {
		onChange({ ...value, [field]: event.currentTarget.checked });
	});

	return (
		<Group
			gap="xs"
			mih={36}
		>
			<Text
				fz="lg"
				fw={500}
				c="bright"
			>
				{name}
			</Text>
			{description && (
				<Tooltip label={description}>
					<div>
						<Icon
							path={iconHelp}
							size="sm"
						/>
					</div>
				</Tooltip>
			)}
			<Spacer />
			<Switch
				checked={checked}
				disabled={disabled}
				variant="gradient"
				onChange={handleChange}
			/>
		</Group>
	);
}
