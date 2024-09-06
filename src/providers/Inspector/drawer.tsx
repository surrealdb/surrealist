import {
	ActionIcon,
	Center,
	Drawer,
	Group,
	Paper,
	Tabs,
	Text,
	Tooltip,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { RecordId } from "surrealdb";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { CodeInput } from "~/components/Inputs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import type { HistoryHandle } from "~/hooks/history";
import { useSaveable } from "~/hooks/save";
import { useStable } from "~/hooks/stable";
import { useValueValidator } from "~/hooks/surrealql";
import { useIsLight } from "~/hooks/theme";
import { executeQuery } from "~/screens/database/connection/connection";
import {
	iconArrowLeftFat,
	iconClose,
	iconDelete,
	iconJSON,
	iconRefresh,
	iconSearch,
	iconTransfer,
} from "~/util/icons";
import { formatValue, parseValue } from "~/util/surrealql";
import { useConfirmation } from "../Confirmation";
import classes from "./style.module.scss";
import { ContentTab } from "./tabs/content";
import { RelationsTab } from "./tabs/relations";

const DEFAULT_RECORD: ActiveRecord = {
	isEdge: false,
	exists: false,
	initial: "",
	inputs: [],
	outputs: [],
};

interface ActiveRecord {
	isEdge: boolean;
	exists: boolean;
	initial: string;
	inputs: RecordId[];
	outputs: RecordId[];
}

export interface InspectorDrawerProps {
	opened: boolean;
	history: HistoryHandle<RecordId>;
	onClose: () => void;
	onRefresh: () => void;
}

export function InspectorDrawer({
	opened,
	history,
	onClose,
	onRefresh,
}: InspectorDrawerProps) {
	const [currentRecord, setCurrentRecord] =
		useState<ActiveRecord>(DEFAULT_RECORD);
	const [recordId, setRecordId] = useInputState("");
	const [recordBody, setRecordBody] = useState("");
	const [isValid, body] = useValueValidator(recordBody);

	const isLight = useIsLight();
	const inputColor = currentRecord.exists
		? undefined
		: "var(--mantine-color-red-6)";

	const saveHandle = useSaveable({
		valid: isValid,
		track: {
			recordBody,
		},
		onRevert(original) {
			setRecordBody(original.recordBody);
		},
		onSave() {
			saveRecord();
		},
	});

	const fetchRecord = useStable(async (id: RecordId) => {
		const contentQuery = /* surql */ `SELECT * FROM ONLY $id`;
		const inputQuery = /* surql */ `SELECT VALUE <-? FROM ONLY $id`;
		const outputsQuery = /* surql */ `SELECT VALUE ->? FROM ONLY $id`;

		const [{ result: content }, { result: inputs }, { result: outputs }] =
			await executeQuery(
				`${contentQuery};${inputQuery};${outputsQuery}`,
				{ id },
			);

		const formatted = formatValue(content, false, true);

		setRecordId(formatValue(id));
		setCurrentRecord({
			isEdge: !!content?.in && !!content?.out,
			exists: !!content,
			initial: formatted,
			inputs,
			outputs,
		});

		if (content) {
			setRecordBody(formatted);
		}

		saveHandle.track();
	});

	const refreshRecord = useStable(() => {
		if (history.current) {
			fetchRecord(history.current);
		}
	});

	const saveRecord = useStable(async () => {
		const id = history.current;

		await executeQuery(/* surql */ `UPDATE $id CONTENT $body`, {
			id,
			body,
		});

		onRefresh();
		onClose();
	});

	const gotoRecord = useStable(() => {
		const id = parseValue(recordId);

		if (id instanceof RecordId) {
			history.push(id);
		}
	});

	const deleteRecord = useConfirmation({
		message:
			"You are about to delete this record. This action cannot be undone.",
		confirmText: "Delete",
		onConfirm: async () => {
			await executeQuery(
				/* surql */ `DELETE ${formatValue(history.current)}`,
			);

			history.clear();

			onRefresh();
			onClose();
		},
	});

	useEffect(() => {
		if (history.current) {
			fetchRecord(history.current);
		}
	}, [history.current]);

	const [width, setWidth] = useState(650);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			size={width}
			styles={{
				body: {
					height: "100%",
					display: "flex",
					flexDirection: "column",
				},
			}}
		>
			<DrawerResizer minSize={500} maxSize={1500} onResize={setWidth} />

			<Group mb="md" gap="sm">
				<PrimaryTitle>
					<Icon left path={iconSearch} size="sm" />
					Record inspector
				</PrimaryTitle>

				<Spacer />

				<Group align="center">
					{history.canPop && (
						<Tooltip label="Go back">
							<ActionIcon
								onClick={history.pop}
								aria-label="Go back in history"
							>
								<Icon path={iconArrowLeftFat} />
							</ActionIcon>
						</Tooltip>
					)}

					<Tooltip label="Delete record">
						<ActionIcon
							disabled={!currentRecord.exists}
							onClick={deleteRecord}
							color="pink.7"
							aria-label="Delete record"
						>
							<Icon path={iconDelete} />
						</ActionIcon>
					</Tooltip>

					<Tooltip label="Refetch from database">
						<ActionIcon
							onClick={refreshRecord}
							aria-label="Refetch record"
						>
							<Icon path={iconRefresh} />
						</ActionIcon>
					</Tooltip>

					<ActionIcon
						onClick={onClose}
						aria-label="Close inspector drawer"
					>
						<Icon path={iconClose} />
					</ActionIcon>
				</Group>
			</Group>

			<CodeInput
				mb="xs"
				value={recordId}
				onBlur={gotoRecord}
				onSubmit={gotoRecord}
				onChange={setRecordId}
				variant="filled"
				rightSectionWidth={76}
				classNames={{
					input: classes.recordInput,
				}}
				styles={{
					input: {
						color: inputColor,
						borderColor: inputColor,
					},
				}}
				rightSection={
					currentRecord.isEdge && (
						<Paper
							title="This record is an edge"
							bg="slate"
							c="bright"
							px="xs"
						>
							Edge
						</Paper>
					)
				}
			/>

			{currentRecord.exists ? (
				<Tabs
					mt="sm"
					defaultValue="content"
					className={classes.tabs}
					variant="pills"
					radius="sm"
				>
					<Tabs.List grow>
						<Tabs.Tab value="content">
							Content
							<Icon path={iconJSON} size={0.85} right />
						</Tabs.Tab>
						<Tabs.Tab value="relations">
							Relations
							<Icon path={iconTransfer} size={0.85} right />
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="content">
						<ContentTab
							value={recordBody}
							saveHandle={saveHandle}
							onChange={setRecordBody}
						/>
					</Tabs.Panel>

					<Tabs.Panel value="relations">
						<RelationsTab
							isLight={isLight}
							inputs={currentRecord.inputs}
							outputs={currentRecord.outputs}
						/>
					</Tabs.Panel>
				</Tabs>
			) : (
				<Center my="xl">
					<Text>Record not found in database</Text>
				</Center>
			)}
		</Drawer>
	);
}
