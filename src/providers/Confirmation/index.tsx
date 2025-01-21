import { type PropsWithChildren, type ReactNode, createContext, useContext, useState } from "react";

import { Button, type ButtonProps, Divider, Group, Text, TextInput } from "@mantine/core";
import { Modal } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useActiveKeys } from "~/hooks/keys";
import { useStable } from "~/hooks/stable";
import { isSimilar } from "~/util/helpers";

type DynamicNode<T> = ReactNode | ((value: T) => ReactNode);

interface ConfirmOptions<T> {
	title?: DynamicNode<T>;
	message: DynamicNode<T>;
	skippable?: boolean;
	dismissText?: DynamicNode<T>;
	dismissProps?: ButtonProps;
	confirmText?: DynamicNode<T>;
	confirmProps?: ButtonProps;
	verification?: string;
	verifyText?: ReactNode;
	onDismiss?: () => void;
	onConfirm: (value: T) => void;
}

const ConfirmContext = createContext<{
	setConfirmation: (value: any, options: ConfirmOptions<any>) => void;
} | null>(null);

function applyNode<T>(node: DynamicNode<T>, value: T) {
	return typeof node === "function" ? node(value) : node;
}

/**
 * Returns a function which can be used to trigger a confirmation dialog
 */
export function useConfirmation<T>(options: ConfirmOptions<T>): (value?: T) => void {
	const ctx = useContext(ConfirmContext);

	if (!ctx) {
		throw new Error("useConfirmation must be used within an ConfirmationProvider");
	}

	return useStable((value) => {
		ctx.setConfirmation(value, options);
	});
}

const DEFAULT_TITLE = "Are you sure?";
const DEFAULT_DISMISS = "Close";
const DEFAULT_CONFIRM = "Continue";

export function ConfirmationProvider({ children }: PropsWithChildren) {
	const [isConfirming, setIsConfirming] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions<any>>();
	const [confirm, setConfirm] = useInputState("");
	const [value, setValue] = useState<any>();

	const isShifting = useActiveKeys("Shift");

	const setConfirmation = (value: any, options: ConfirmOptions<any>) => {
		if (isConfirming) {
			throw new Error("Confirmation already in progress");
		}

		setValue(value);
		setOptions(options);
		setConfirm("");

		if (options.skippable && isShifting) {
			options?.onConfirm?.(value);
		} else {
			setIsConfirming(true);
		}
	};

	const onDissmiss = useStable(() => {
		setIsConfirming(false);
		options?.onDismiss?.();
	});

	const onConfirm = useStable(() => {
		setIsConfirming(false);
		options?.onConfirm?.(value);
	});

	const isVerified = options?.verification ? isSimilar(confirm, options.verification) : true;

	return (
		<ConfirmContext.Provider value={{ setConfirmation }}>
			{children}

			<Modal
				opened={isConfirming}
				onClose={onDissmiss}
				zIndex={210}
				title={
					<PrimaryTitle>{applyNode(options?.title ?? DEFAULT_TITLE, value)}</PrimaryTitle>
				}
			>
				<Text fz="lg">{applyNode(options?.message, value)}</Text>
				{options?.verification && (
					<>
						<Divider my="lg" />
						<TextInput
							value={confirm}
							onChange={setConfirm}
							label={
								options?.verifyText ?? (
									<>Please type "{options.verification}" to confirm</>
								)
							}
							autoFocus
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									onConfirm();
								}
							}}
						/>
					</>
				)}
				<Group mt="xl">
					<Button
						onClick={onDissmiss}
						variant="light"
						color="slate"
						{...(options?.dismissProps || {})}
					>
						{applyNode(options?.dismissText ?? DEFAULT_DISMISS, value)}
					</Button>
					<Spacer />
					<Button
						color="red"
						onClick={onConfirm}
						disabled={!isVerified}
						{...options?.confirmProps}
					>
						{applyNode(options?.confirmText ?? DEFAULT_CONFIRM, value)}
					</Button>
				</Group>
			</Modal>
		</ConfirmContext.Provider>
	);
}
