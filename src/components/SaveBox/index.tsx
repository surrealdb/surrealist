import classes from "./style.module.scss";
import { Button, Group, Notification, Portal, clsx } from "@mantine/core";
import { mdiCheck, mdiInformationOutline } from "@mdi/js";
import { Icon } from "../Icon";
import { SaveableHandle } from "~/hooks/save";
import { ReactNode } from "react";
import { capitalize } from "radash";
import { Spacer } from "../Spacer";

export interface SaveBoxProps {
	handle: SaveableHandle<any>;
	inline?: boolean;
	position?: "left" | "center" | "right";
	saveText?: ReactNode;
	revertText?: ReactNode;
}

/**
 * Used to present the managed state of a `useSaveable` hook
 * in the form of a save box.
 */
export function SaveBox({ handle, inline, position, saveText, revertText }: SaveBoxProps) {

	const saveButton = (
		<Button
			rightIcon={<Icon path={mdiCheck} size="md" />}
			loading={handle.isSaving}
			disabled={!handle.isSaveable}
			onClick={handle.save}
		>
			{saveText ?? 'Save changes'}
		</Button>
	);

	const revertButton = (
		<Button
			disabled={!handle.isSaveable}
			onClick={handle.revert}
			color="dark.4"
		>
			{revertText ?? 'Revert'}
		</Button>
	);


	if (inline) {
		return (
			<Group spacing={10} align="center" position="apart">
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
							path={mdiInformationOutline}
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
					<Group spacing={10} align="center">
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
