import classes from "./style.module.scss";
import { Button, Group, GroupProps, Notification, Portal } from "@mantine/core";
import { Icon } from "../Icon";
import { SaveableHandle } from "~/hooks/save";
import { ReactNode } from "react";
import { capitalize } from "radash";
import { Spacer } from "../Spacer";
import { clsx } from "clsx";
import { iconCheck, iconHelp } from "~/util/icons";

export interface SaveBoxProps {
	handle: SaveableHandle;
	inline?: boolean;
	inlineProps?: GroupProps;
	position?: "left" | "center" | "right";
	saveText?: ReactNode;
	revertText?: ReactNode;
}

/**
 * Used to present the managed state of a `useSaveable` hook
 * in the form of a save box.
 */
export function SaveBox({ handle, inline, inlineProps, position, saveText, revertText }: SaveBoxProps) {

	const saveButton = (
		<Button
			rightSection={<Icon path={iconCheck} />}
			variant="gradient"
			loading={handle.isSaving}
			disabled={!handle.isSaveable}
			onClick={handle.save}
		>
			{saveText ?? 'Save changes'}
		</Button>
	);

	const revertButton = (
		<Button
			disabled={!handle.isChanged}
			onClick={handle.revert}
			color="slate"
		>
			{revertText ?? 'Revert'}
		</Button>
	);


	if (inline) {
		return (
			<Group gap={10} align="center" justify="apart" {...inlineProps}>
				{revertButton}
				{saveButton}
			</Group>
		);
	} else {
		return (
			<Portal>
				<Notification
					withCloseButton={false}
					className={clsx(
						classes.savebox,
						classes[`savebox${capitalize(position ?? 'center')}`],
						!handle.isChanged && classes.saveboxHidden
					)}
					icon={
						<Icon
							path={iconHelp}
							size="lg"
							mr={-8}
						/>
					}
					styles={{
						icon: {
							backgroundColor: 'transparent !important',
							color: 'var(--mantine-color-surreal-5) !important',
						},
						body: {
							margin: 0
						}
					}}
				>
					<Group gap={10} align="center">
						There are unsaved changes
						<Spacer />
						{revertButton}
						{saveButton}
					</Group>
				</Notification>
			</Portal>
		);
	}
}
