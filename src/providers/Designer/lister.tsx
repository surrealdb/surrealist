import { Group, Stack, Button, Text, ActionIcon, Modal, Box } from "@mantine/core";
import { ReactNode, useState } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useLater } from "~/hooks/later";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { iconCircle, iconClose, iconPlus } from "~/util/icons";

export interface ListerProps<T> {
	name: string;
	missing: string;
	value: T[];
	children: (item: T, index: number) => ReactNode;
	onCreate: () => void;
	onRemove: (index: number) => void;
}

export function Lister<T extends { name: string }>(props: ListerProps<T>) {
	const [isEditing, setIsEditing] = useState(false);
	const [editingIndex, setEditingIndex] = useState(-1);
	const isLight = useIsLight();

	const openEditor = useStable((index: number) => {
		setEditingIndex(index);
		setIsEditing(true);
	});

	const closeEditor = useStable(() => {
		setIsEditing(false);
	});

	const handleRemove = useStable((e: React.MouseEvent, index: number) => {
		e.stopPropagation();
		props.onRemove(index);
	});

	const openLatest = useStable(() => {
		openEditor(props.value.length - 1);
	});

	const scheduleOpenLatest = useLater(openLatest);

	const handleCreate = useStable(() => {
		props.onCreate();
		scheduleOpenLatest();
	});

	const editingData = props.value[editingIndex];

	return (
		<>
			{props.value.length > 0 ? (
				<Box>
					{props.value.map((item, i) => (
						<Button
							key={i}
							px="xs"
							fullWidth
							color="slate"
							variant="subtle"
							onClick={() => openEditor(i)}
							styles={{
								label: { flex: 1 }
							}}
							leftSection={
								<Icon path={iconCircle} c="slate.4" />
							}
							rightSection={
								<ActionIcon
									role="button"
									component="div"
									onClick={(e) => handleRemove(e, i)}
									color="pink.9"
									variant="transparent"
									aria-label="Remove item"
								>
									<Icon path={iconClose} />
								</ActionIcon>
							}
						>
							{item.name ? (
								<Text c="bright" fw={500} ff="monospace">
									{item.name}
								</Text>
							) : (
								<Text c="slate.3" fw={500} ff="monospace">
									Unnamed {props.name}
								</Text>
							)}
						</Button>
					))}
				</Box>
			) : (
				<Text ta="center">
					{props.missing}
				</Text>
			)}

			<Button
				mt="md"
				size="xs"
				fullWidth
				variant="gradient"
				rightSection={<Icon path={iconPlus} />}
				onClick={handleCreate}
			>
				Add {props.name}
			</Button>

			<Modal
				opened={isEditing}
				onClose={closeEditor}
				trapFocus={false}
				title={
					<PrimaryTitle>{`Editing ${props.name}`}</PrimaryTitle>
				}
			>
				<Stack>
					{editingData && props.children(editingData, editingIndex)}

					<Group mt="md">
						<Button
							variant="light"
							color="slate"
							flex={1}
							onClick={closeEditor}
						>
							Finish editing
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
