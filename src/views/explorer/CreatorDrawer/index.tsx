import { ActionIcon, Badge, Button, Drawer, Group, Paper, Text, TextInput } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ModalTitle } from "~/components/ModalTitle";
import { Spacer } from "~/components/Spacer";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useMemo, useState } from "react";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { getSurreal } from "~/util/surreal";
import { iconClose, iconPlus } from "~/util/icons";

export interface CreatorDrawerProps {
	opened: boolean;
	activeTable: string | null;
	onClose: () => void;
	onRefresh: () => void;
}

export function CreatorDrawer({ opened, activeTable, onClose, onRefresh }: CreatorDrawerProps) {
	const isLight = useIsLight();
	const [recordId, setRecordId] = useInputState('');
	const [recordBody, setRecordBody] = useState('');

	const isBodyValid = useMemo(() => {
		try {
			const parsed = JSON.parse(recordBody);

			if (typeof parsed !== "object") {
				throw new TypeError("Invalid JSON");
			}

			return true;
		} catch {
			return false;
		}
	}, [recordBody]);

	const handleSubmit = useStable(async () => {
		const surreal = getSurreal();

		if (!recordId || !isBodyValid || !surreal) {
			return;
		}

		await surreal.query(`CREATE \`${recordId}\` CONTENT ${recordBody}`);

		onClose();
		onRefresh();
	});

	useLayoutEffect(() => {
		if (opened) {
			setRecordId(activeTable || '');
			setRecordBody('{\n    \n}');
		}
	}, [opened]);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			size="lg"
		>
			<Group mb="md" gap="sm">
				<ModalTitle>
					Create record
				</ModalTitle>

				<Spacer />

				{!isBodyValid && (
					<Badge
						color="red"
						variant="light"
					>
						Invalid record json
					</Badge>
				)}

				<ActionIcon onClick={onClose}>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>

			<TextInput
				mb="xs"
				label="Record name"
				value={recordId}
				onChange={setRecordId}
				autoFocus
			/>

			<Text c="dark.0" size="sm">
				Record contents
			</Text>

			<Paper
				mt="xs"
				p="xs"
				withBorder
				style={{
					position: "absolute",
					insetInline: 16,
					bottom: 62,
					top: 136,
				}}
			>
				<SurrealistEditor
					language="json"
					value={recordBody}
					onChange={setRecordBody}
					options={{
						wrappingStrategy: "advanced",
						wordWrap: "off",
						suggest: {
							showProperties: false,
						},
					}}
				/>
			</Paper>

			<Button
				disabled={!recordId || !isBodyValid}
				variant="gradient"
				onClick={handleSubmit}
				rightSection={
					<Icon path={iconPlus} />
				}
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: 12,
				}}
			>
				Create record
			</Button>
		</Drawer>
	);
}
