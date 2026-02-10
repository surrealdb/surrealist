import { Group, Switch, Text, Tooltip } from "@mantine/core";
import { Icon, iconHelp } from "@surrealdb/ui";
import { ChangeEvent } from "react";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
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
	rightSection,
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
			{rightSection}
			<Switch
				checked={checked}
				disabled={disabled}
				variant="gradient"
				onChange={handleChange}
			/>
		</Group>
	);
}
