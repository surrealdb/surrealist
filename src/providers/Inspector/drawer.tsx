import { Center, Drawer, Group, Paper, Tabs, Text } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { RecordId } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
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
import { executeQuery } from "~/screens/surrealist/connection/connection";
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

export function InspectorDrawer({ opened, history, onClose, onRefresh }: InspectorDrawerProps) {
	const [currentRecord, setCurrentRecord] = useState<ActiveRecord>(DEFAULT_RECORD);
	const [recordId, setRecordId] = useInputState("");
	const [recordBody, setRecordBody] = useState("");
	const [error, setError] = useState("");
	const [isValid, body] = useValueValidator(recordBody);

	const isLight = useIsLight();
	const inputColor = currentRecord.exists ? undefined : "var(--mantine-color-red-6)";

	const saveHandle = useSaveable({
		valid: isValid,
		track: {
			recordBody,
		},
		onRevert(original) {
			setRecordBody(original.recordBody);
			setError("");
		},
		onSave: async (_original, isApply) => {
			const id = history.current;

			const [{ success, result }] = await executeQuery(
				/* surql */ `UPDATE $id CONTENT $body`,
				{
					id,
					body,
				},
			);

			if (!success) {
				setError(result.replace("There was a problem with the database: ", ""));
				return false;
			}

			onRefresh();

			if (!isApply) {
				onClose();
			}
		},
	});

	const fetchRecord = useStable(async (id: RecordId) => {
		const contentQuery = /* surql */ `SELECT * FROM ONLY $id`;
		const inputQuery = /* surql */ `SELECT VALUE <-? FROM ONLY $id`;
		const outputsQuery = /* surql */ `SELECT VALUE ->? FROM ONLY $id`;

		const [{ result: content }, { result: inputs }, { result: outputs }] = await executeQuery(
			`${contentQuery};${inputQuery};${outputsQuery}`,
			{ id },
		);

		const formatted = await formatValue(content, false, true);

		setError("");
		setRecordId(await formatValue(id));
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

	const gotoRecord = useStable(async () => {
		const id = await parseValue(recordId);

		if (id instanceof RecordId) {
			history.push(id);
		}
	});

	const deleteRecord = useConfirmation({
		message: "You are about to delete this record. This action cannot be undone.",
		confirmText: "Delete",
		skippable: true,
		onConfirm: async () => {
			await executeQuery(/* surql */ `DELETE ${await formatValue(history.current)}`);

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
			<DrawerResizer
				minSize={500}
				maxSize={1500}
				onResize={setWidth}
			/>

			<Group
				mb="md"
				gap="sm"
			>
				<PrimaryTitle>
					<Icon
						left
						path={iconSearch}
						size="sm"
					/>
					Record inspector
				</PrimaryTitle>

				<Spacer />

				<Group align="center">
					{history.canPop && (
						<ActionButton
							label="Go back"
							onClick={history.pop}
						>
							<Icon path={iconArrowLeftFat} />
						</ActionButton>
					)}

					<ActionButton
						disabled={!currentRecord.exists}
						color="pink.7"
						label="Delete record"
						onClick={deleteRecord}
					>
						<Icon path={iconDelete} />
					</ActionButton>

					<ActionButton
						onClick={refreshRecord}
						label="Refetch record"
					>
						<Icon path={iconRefresh} />
					</ActionButton>

					<ActionButton
						onClick={onClose}
						label="Close drawer"
					>
						<Icon path={iconClose} />
					</ActionButton>
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
							<Icon
								path={iconJSON}
								size={0.85}
								right
							/>
						</Tabs.Tab>
						<Tabs.Tab value="relations">
							Relations
							<Icon
								path={iconTransfer}
								size={0.85}
								right
							/>
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="content">
						<ContentTab
							value={recordBody}
							error={error}
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
