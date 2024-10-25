import { ActionIcon, Box, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { klona } from "klona";
import { replace } from "radash";
import { type ReactNode, useState } from "react";
import { type Updater, useImmer } from "use-immer";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import { iconCircle, iconClose, iconPlus } from "~/util/icons";

export interface ListerProps<T> {
	name: string;
	missing: string;
	value: T[];
	factory: () => T;
	children: (item: T, updater: Updater<T>, isCreating: boolean) => ReactNode;
	onChange: (items: T[]) => void;
	display?: (item: T) => ReactNode;
}

export function Lister<T extends { name: string }>({
	name,
	missing,
	value,
	factory,
	children,
	onChange,
	display,
}: ListerProps<T>) {
	const [isEditing, editingHandle] = useBoolean(false);
	const [isCreating, setIsCreating] = useState(false);
	const [values, setValues] = useImmer<T | null>(null);

	const openEditor = useStable((item: T) => {
		setValues(klona(item));
		editingHandle.open();
		setIsCreating(false);
	});

	const saveEditor = useStable(() => {
		editingHandle.close();
		if (!values) return;

		if (isCreating) {
			onChange([...value, values]);
		} else {
			onChange(replace(value, values, (i) => i.name === values.name));
		}
	});

	const handleRemove = useStable((e: React.MouseEvent, item: T) => {
		e.stopPropagation();
		onChange(value.filter((i) => i !== item));
	});

	const handleCreate = useStable(() => {
		setValues(factory());
		editingHandle.open();
		setIsCreating(true);
	});

	return (
		<>
			{value.length > 0 ? (
				<Box>
					{value.map((item) => (
						<Button
							key={item.name}
							px="xs"
							fullWidth
							color="slate"
							variant="subtle"
							onClick={() => openEditor(item)}
							styles={{
								label: { flex: 1 },
							}}
							leftSection={
								<Icon
									path={iconCircle}
									c="slate.4"
								/>
							}
							rightSection={
								<ActionIcon
									role="button"
									component="div"
									onClick={(e) => handleRemove(e, item)}
									color="pink.9"
									variant="transparent"
									aria-label="Remove item"
								>
									<Icon path={iconClose} />
								</ActionIcon>
							}
						>
							<Text
								c="bright"
								fw={500}
								ff="monospace"
								component="div"
							>
								{display?.(item) ?? item.name}
							</Text>
						</Button>
					))}
				</Box>
			) : (
				<Text ta="center">{missing}</Text>
			)}

			<Button
				mt="md"
				size="xs"
				fullWidth
				variant="gradient"
				rightSection={<Icon path={iconPlus} />}
				onClick={handleCreate}
			>
				Add {name}
			</Button>

			<Modal
				opened={isEditing}
				onClose={editingHandle.close}
				trapFocus={false}
				title={
					<PrimaryTitle>
						{isCreating ? "Creating" : "Editing"} {name}
					</PrimaryTitle>
				}
			>
				<Form onSubmit={saveEditor}>
					<Stack>{values && children(values, setValues as any, isCreating)}</Stack>
					<Group mt="xl">
						<Button
							flex={1}
							color="slate"
							variant="light"
							onClick={editingHandle.close}
						>
							Close
						</Button>
						<Button
							flex={1}
							variant="gradient"
							disabled={!values?.name}
							type="submit"
						>
							Save
						</Button>
					</Group>
				</Form>
			</Modal>
		</>
	);
}
