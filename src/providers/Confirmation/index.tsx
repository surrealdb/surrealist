import { Button, ButtonProps, Group, Text } from "@mantine/core";
import { Modal } from "@mantine/core";
import { PropsWithChildren, createContext, useContext, useState } from "react";
import { ModalTitle } from "~/components/ModalTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";

interface ConfirmOptions<T> {
	title?: string;
	message: string;
	dismissText?: string;
	dismissProps?: ButtonProps;
	confirmText?: string;
	confirmProps?: ButtonProps;
	onDismiss?: () => void;
	onConfirm: (value: T) => void;
}

const ConfirmContext = createContext<{
	setConfirmation: (value: any, options: ConfirmOptions<any>) => void
} | null>(null);

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

const DEFAULT_TITLE = 'Are you sure?';
const DEFAULT_DISMISS = 'Close';
const DEFAULT_CONFIRM = 'Continue';

export function ConfirmationProvider({ children }: PropsWithChildren) {
	const [isConfirming, setIsConfirming] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions<any>>();
	const [value, setValue] = useState<any>();

	const setConfirmation = (value: any, options: ConfirmOptions<any>) => {
		if (isConfirming) {
			throw new Error("Confirmation already in progress");
		}

		setValue(value);
		setOptions(options);
		setIsConfirming(true);
	};

	const onDissmiss = useStable(() => {
		setIsConfirming(false);
		options?.onDismiss?.();
	});

	const onConfirm = useStable(() => {
		setIsConfirming(false);
		options?.onConfirm?.(value);
	});

	return (
		<ConfirmContext.Provider value={{ setConfirmation }}>
			{children}

			<Modal
				opened={isConfirming}
				onClose={onDissmiss}
				title={<ModalTitle>{options?.title ?? DEFAULT_TITLE}</ModalTitle>}
				zIndex={210}
			>
				<Text>
					{options?.message}
				</Text>
				<Group mt="lg">
					<Button
						onClick={onDissmiss}
						variant="light"
						color="slate"
						{...options?.dismissProps || {}}
					>
						{options?.dismissText ?? DEFAULT_DISMISS}
					</Button>
					<Spacer />
					<Button
						color="pink.9"
						onClick={onConfirm}
						{...options?.confirmProps}
					>
						{options?.confirmText ?? DEFAULT_CONFIRM}
					</Button>
				</Group>
			</Modal>
		</ConfirmContext.Provider>
	);
}