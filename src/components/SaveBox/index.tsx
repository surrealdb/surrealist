import {
	Button,
	Group,
	type GroupProps,
	Notification,
	Portal,
} from "@mantine/core";
import { clsx } from "clsx";
import { capitalize } from "radash";
import type { ReactNode } from "react";
import type { SaveableHandle } from "~/hooks/save";
import { iconCheck, iconHelp } from "~/util/icons";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import classes from "./style.module.scss";

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
export function SaveBox({
	handle,
	inline,
	inlineProps,
	position,
	saveText,
	revertText,
}: SaveBoxProps) {
	const saveButton = (
		<Button
			rightSection={<Icon path={iconCheck} />}
			variant="gradient"
			loading={handle.isSaving}
			disabled={!handle.isSaveable}
			onClick={handle.save}
		>
			{saveText ?? "Save changes"}
		</Button>
	);

	const revertButton = (
		<Button
			disabled={!handle.isChanged}
			onClick={handle.revert}
			color="slate"
			variant="light"
		>
			{revertText ?? "Revert"}
		</Button>
	);

	if (inline) {
		return (
			<Group gap={10} align="center" justify="apart" {...inlineProps}>
				{revertButton}
				{saveButton}
			</Group>
		);
	}

	return (
		<Portal>
			<Notification
				withCloseButton={false}
				className={clsx(
					classes.savebox,
					classes[`savebox${capitalize(position ?? "center")}`],
					!handle.isChanged && classes.saveboxHidden,
				)}
				icon={<Icon path={iconHelp} size="lg" mr={-8} />}
				styles={{
					icon: {
						backgroundColor: "transparent !important",
						color: "var(--mantine-color-surreal-5) !important",
					},
					body: {
						margin: 0,
					},
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
