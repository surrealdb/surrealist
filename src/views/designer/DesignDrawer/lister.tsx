import { Group, Stack, Button, Text, ActionIcon, Paper, Modal } from "@mantine/core";
import { ReactNode, useState } from "react";
import { Icon } from "~/components/Icon";
import { ModalTitle } from "~/components/ModalTitle";
import { Spacer } from "~/components/Spacer";
import { useLater } from "~/hooks/later";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { iconClose, iconPlus } from "~/util/icons";

export interface ListerProps<T> {
	name: string;
	missing: string;
	value: T[];
	children: (item: T, index: number) => ReactNode;
	onCreate: () => void;
	onRemove: (index: number) => void;
}

export function Lister<T extends { name: string }>(props: ListerProps<T>) {
	const isLight = useIsLight();
	const [isEditing, setIsEditing] = useState(false);
	const [editingIndex, setEditingIndex] = useState(-1);

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
				<Stack gap={6}>
					{props.value.map((item, i) => (
						<Paper
							key={i}
							p="xs"
							pl="md"
							bg={isLight ? "slate.0" : "slate.8"}
							pos="relative"
							radius="md"
							style={{ border: 0, cursor: "pointer" }}
							onClick={() => openEditor(i)}
						>
							<Group gap="sm">
								{item.name ? (
									<Text c="bright">
										{item.name}
									</Text>
								) : (
									<Text c="dark.2">
										Unnamed {props.name}
									</Text>
								)}
								<Spacer />
								<ActionIcon
									role="button"
									component="div"
									onClick={(e) => handleRemove(e, i)}
									color="pink.7"
									variant="subtle"
									aria-label="Remove item"
								>
									<Icon path={iconClose} />
								</ActionIcon>
							</Group>
						</Paper>
					))}
				</Stack>
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
					<ModalTitle>{`Editing ${props.name}`}</ModalTitle>
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
