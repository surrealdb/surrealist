import { Button, type ButtonProps, Divider, Group, Modal, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import {
	createContext,
	type PropsWithChildren,
	type ReactNode,
	useContext,
	useRef,
	useState,
} from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useSetting } from "~/hooks/config";
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
	onConfirm: (value: T) => Result<void>;
	onError?: (error: any) => void;
}

const ConfirmContext = createContext<{
	setConfirmation: (value: any, options: ConfirmOptions<any>) => void;
} | null>(null);

function applyNode<T>(node: DynamicNode<T>, value: T) {
	return typeof node === "function" ? node(value) : node;
}

/**
 * Returns a function which can be used to trigger a confirmation dialog
 *
 * @param options The options for the confirmation dialog
 * @return A function which can be used to trigger the confirmation dialog.
 * You can pass an optional value to pass to the confirmation dialog, and
 * optional options to override the default options.
 */
export function useConfirmation<T>(
	options: ConfirmOptions<T>,
): (value?: T, overrideOptions?: ConfirmOptions<T>) => void {
	const ctx = useContext(ConfirmContext);

	if (!ctx) {
		throw new Error("useConfirmation must be used within an ConfirmationProvider");
	}

	return useStable((value, overrideOptions) => {
		ctx.setConfirmation(value, { ...options, ...overrideOptions });
	});
}

const DEFAULT_TITLE = "Are you sure?";
const DEFAULT_DISMISS = "Close";
const DEFAULT_CONFIRM = "Continue";

export function ConfirmationProvider({ children }: PropsWithChildren) {
	const [isConfirming, setIsConfirming] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions<any>>();
	const [confirm, setConfirm] = useInputState("");
	const [value, setValue] = useState<any>();

	const isShifting = useActiveKeys("Shift");
	const confirmationRef = useRef<HTMLButtonElement>(null);
	const [enterConfirms] = useSetting("behavior", "enterConfirms");

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

	const onConfirm = useStable(async () => {
		try {
			setIsPending(true);
			await options?.onConfirm?.(value);
		} catch (error) {
			options?.onError?.(error);
		} finally {
			setIsConfirming(false);
			setIsPending(false);
		}
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
				onKeyDown={(e) => {
					if (
						enterConfirms &&
						e.key === "Enter" &&
						(!options?.verification || isVerified)
					) {
						confirmationRef.current?.focus();
					}
				}}
			>
				<Text fz="lg">{applyNode(options?.message, value)}</Text>
				{options?.verification && (
					<>
						<Divider my="lg" />
						<TextInput
							value={confirm}
							onChange={setConfirm}
							placeholder={options.verification}
							label={
								options?.verifyText ?? (
									<>Please type "{options.verification}" to confirm</>
								)
							}
							onKeyDown={(event) => {
								if (event.key === "Enter" && isVerified) {
									onConfirm();
								}
							}}
							autoFocus
						/>
					</>
				)}
				<Group mt="xl">
					<Button
						onClick={onDissmiss}
						variant="light"
						color="obsidian"
						{...(options?.dismissProps || {})}
					>
						{applyNode(options?.dismissText ?? DEFAULT_DISMISS, value)}
					</Button>
					<Spacer />
					<Button
						ref={confirmationRef}
						color="red"
						variant="filled"
						onClick={onConfirm}
						disabled={!isVerified}
						loading={isPending}
						{...options?.confirmProps}
					>
						{applyNode(options?.confirmText ?? DEFAULT_CONFIRM, value)}
					</Button>
				</Group>
			</Modal>
		</ConfirmContext.Provider>
	);
}
