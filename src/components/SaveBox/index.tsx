import { Button, Group, type GroupProps, Notification, Portal } from "@mantine/core";
import { clsx } from "clsx";
import { capitalize } from "radash";
import type { ReactNode } from "react";
import type { SaveableHandle } from "~/hooks/save";
import { iconCheck, iconHelp, iconReset } from "~/util/icons";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import classes from "./style.module.scss";

export interface SaveBoxProps {
	handle: SaveableHandle;
	inline?: boolean;
	inlineProps?: GroupProps;
	minimal?: boolean;
	allowApply?: boolean;
	position?: "left" | "center" | "right";
	saveText?: ReactNode;
	applyText?: ReactNode;
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
	minimal,
	allowApply,
	applyText,
	revertText,
}: SaveBoxProps) {
	const saveButton = (
		<Button
			w={minimal ? undefined : 125}
			rightSection={<Icon path={iconCheck} />}
			variant="gradient"
			loading={handle.isSaving}
			disabled={!handle.isSaveable}
			onClick={() => handle.save()}
			px={!minimal ? 32 : undefined}
		>
			{saveText ?? (minimal ? "Save changes" : "Save")}
		</Button>
	);

	const applyButton = (
		<Button
			w={minimal ? undefined : 125}
			color="slate"
			variant="light"
			loading={handle.isSaving}
			disabled={!handle.isSaveable}
			onClick={() => handle.save(true)}
			px={!minimal ? 32 : undefined}
		>
			{applyText ?? "Apply"}
		</Button>
	);

	const revertButton = (
		<Button
			maw={minimal ? undefined : 150}
			disabled={!handle.isChanged}
			onClick={handle.revert}
			color="slate"
			variant="light"
		>
			{revertText ?? (minimal ? "Revert" : "Revert changes")}
		</Button>
	);

	if (inline) {
		return (
			<Group
				gap={10}
				align="center"
				justify="apart"
				{...inlineProps}
			>
				{revertButton}
				{!minimal && <Spacer />}

				{(allowApply || !minimal) && (
					<Button.Group>
						{allowApply && applyButton}
						{saveButton}
					</Button.Group>
				)}

				{!allowApply && minimal && saveButton}
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
				icon={
					<Icon
						path={iconHelp}
						size="lg"
						mr={-8}
					/>
				}
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
				<Group
					gap={10}
					align="center"
				>
					There are unsaved changes
					<Spacer />
					{revertButton}
					<Spacer />
					<Button.Group>
						{allowApply && applyButton}
						{saveButton}
					</Button.Group>
				</Group>
			</Notification>
		</Portal>
	);
}
