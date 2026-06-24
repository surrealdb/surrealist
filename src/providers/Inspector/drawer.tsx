import {
	ActionIcon,
	Badge,
	Center,
	Divider,
	Drawer,
	Group,
	Menu,
	Space,
	Switch,
	Tabs,
	Text,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import {
	Icon,
	iconArrowEnter,
	iconArrowLeft,
	iconBraces,
	iconClose,
	iconCopy,
	iconDelete,
	iconDotsVertical,
	iconLive,
	iconPlus,
	iconQuery,
	iconRefresh,
	iconRelation,
	iconSearch,
} from "@surrealdb/ui";
import { useEffect, useRef, useState } from "react";
import { eq, type LiveSubscription, RecordId } from "surrealdb";
import { adapter } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { DrawerResizer } from "~/components/DrawerResizer";
import { CodeInput } from "~/components/Inputs";
import { Spacer } from "~/components/Spacer";
import { LQ_SUPPORTED, MAX_LIVE_MESSAGES } from "~/constants";
import { useConnection, useMinimumVersion } from "~/hooks/connection";
import type { HistoryHandle } from "~/hooks/history";
import { useSaveable } from "~/hooks/save";
import { useTables } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useValueValidator } from "~/hooks/surrealql";
import {
	executeQuery,
	getSurreal,
	getSurrealQL,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import type { LiveMessage } from "~/types";
import { newId } from "~/util/helpers";
import { getTableVariant } from "~/util/schema";
import { SDB_3_0_0 } from "~/util/versions";
import type { CreateState } from ".";
import classes from "./style.module.scss";
import { ContentTab } from "./tabs/content";
import { CreateTab } from "./tabs/create";
import { LiveFeedTab } from "./tabs/live";
import { ReferencesTab } from "./tabs/references";
import { normalizeRelations, RelationsTab } from "./tabs/relations";
import { useRecordActions } from "./use-record-actions";

const DEFAULT_RECORD: ActiveRecord = {
	isEdge: false,
	exists: false,
	initial: "",
	content: null,
	inputs: [],
	outputs: [],
	references: [],
};

interface ActiveRecord {
	isEdge: boolean;
	exists: boolean;
	initial: string;
	content: Record<string, unknown> | null;
	inputs: RecordId[];
	outputs: RecordId[];
	references: RecordId[];
}

export interface InspectorDrawerProps {
	opened: boolean;
	history: HistoryHandle<RecordId>;
	createState: CreateState | null;
	onClose: () => void;
	onRefresh: () => void;
}

export function InspectorDrawer({
	opened,
	history,
	createState,
	onClose,
	onRefresh,
}: InspectorDrawerProps) {
	const isCreating = !!createState;

	const [currentRecord, setCurrentRecord] = useState<ActiveRecord>(DEFAULT_RECORD);
	const [recordId, setRecordId] = useInputState("");
	const [recordBody, setRecordBody] = useState("");
	const [error, setError] = useState("");
	const [isValid, body] = useValueValidator(recordBody);
	const [tab, setTab] = useState("content");
	const [syncContent, setSyncContent] = useState(false);
	const [messages, setMessages] = useState<LiveMessage[]>([]);

	const inputColor = currentRecord.exists ? undefined : "var(--mantine-color-red-6)";

	const protocol = useConnection((c) => c?.authentication.protocol);
	const liveSupported = !!protocol && LQ_SUPPORTED.has(protocol);

	const [supportsReferences] = useMinimumVersion(SDB_3_0_0);

	const tableSchema = useTables().find((t) => t.schema.name === history.current?.table.name);
	const allowCreate = tableSchema ? getTableVariant(tableSchema) !== "view" : true;

	// Read the latest sync preference from the live handler without re-subscribing
	const syncContentRef = useRef(syncContent);
	syncContentRef.current = syncContent;

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

		const queryParts = [contentQuery, inputQuery, outputsQuery];

		if (supportsReferences) {
			queryParts.push(/* surql */ `SELECT VALUE <~? FROM ONLY $id`);
		}

		const results = await executeQuery(queryParts.join(";"), { id });

		const [{ result: content }, { result: inputs }, { result: outputs }] = results;
		const references = supportsReferences ? results[3]?.result : undefined;

		const formatted = await getSurrealQL().formatValue(content, false, true);

		setError("");
		setRecordId(await getSurrealQL().formatValue(id));
		setCurrentRecord({
			isEdge: !!content?.in && !!content?.out,
			exists: !!content,
			initial: formatted,
			content: content ?? null,
			inputs: normalizeRelations(inputs),
			outputs: normalizeRelations(outputs),
			references: normalizeRelations(references),
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

	// Overwrite the editor with the incoming record and treat it as the new
	// origin state, so the live update is reflected without flagging changes.
	const commitLiveBody = useStable((formatted: string) => {
		setRecordBody(formatted);
		saveHandle.track();
	});

	const gotoRecord = useStable(async () => {
		const id = await getSurrealQL().parseValue(recordId);

		if (id instanceof RecordId) {
			history.push(id);
		}
	});

	const handleToggleSync = useStable(() => {
		setSyncContent((v) => !v);
	});

	const { duplicateRecord, copyRecordId, copyRecordJson, openQuery, deleteRecord } =
		useRecordActions({
			onRefresh,
			onError: setError,
			onDeleted: () => {
				history.clear();
				onClose();
			},
		});

	const createQuery = useStable((id: RecordId, query: string) => {
		openQuery(id, query);
		onClose();
	});

	const activeRecordId = history.current;

	useEffect(() => {
		if (!supportsReferences && tab === "references") {
			setTab("content");
		}
	}, [supportsReferences, tab]);

	useEffect(() => {
		if (!isCreating && history.current) {
			fetchRecord(history.current);
		}
	}, [history.current, isCreating]);

	// Keep a live subscription open for the inspected record the whole time the
	// drawer is open. Every notification is appended to the live feed; the editor
	// content is only overwritten when "Sync with content" is enabled.
	useEffect(() => {
		const id = history.current;

		if (!opened || isCreating || !liveSupported || !id) {
			return;
		}

		let active = true;
		let subscription: LiveSubscription | undefined;

		setMessages([]);

		(async () => {
			try {
				const sub = await getSurreal().live(id.table).where(eq("id", id));

				if (!active) {
					sub.kill();
					return;
				}

				subscription = sub;

				sub.subscribe(async ({ action, value, queryId }) => {
					if (!active) {
						return;
					}

					setMessages((prev) =>
						[
							{
								id: newId(),
								action,
								queryId: queryId.toString(),
								data: value,
								timestamp: Date.now(),
							},
							...prev,
						].slice(0, MAX_LIVE_MESSAGES),
					);

					if (syncContentRef.current && (action === "CREATE" || action === "UPDATE")) {
						const formatted = await getSurrealQL().formatValue(value, false, true);

						if (active) {
							commitLiveBody(formatted);
						}
					}
				});
			} catch (err: any) {
				if (active) {
					adapter.warn("Inspector", `Failed to start live query: ${err.message}`);
				}
			}
		})();

		return () => {
			active = false;
			subscription?.kill();
		};
	}, [opened, isCreating, liveSupported, history.current]);

	// Reset the feed and sync preference whenever the drawer is closed
	useEffect(() => {
		if (!opened) {
			setMessages([]);
			setSyncContent(false);
		}
	}, [opened]);

	const [width, setWidth] = useState(650);

	return (
		<Drawer
			withCloseButton={false}
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
				<Group>
					<Icon path={isCreating ? iconPlus : iconSearch} />
					<Text
						fw={600}
						c="bright"
						fz="xl"
					>
						{isCreating ? "Record creator" : "Record inspector"}
					</Text>
				</Group>

				<Spacer />

				<Group align="center">
					{!isCreating && history.canPop && (
						<ActionButton
							label="Go back"
							onClick={history.pop}
						>
							<Icon path={iconArrowLeft} />
						</ActionButton>
					)}

					{!isCreating && activeRecordId && (
						<Menu
							position="bottom-end"
							// transitionProps={{ transition: "scale-y" }}
						>
							<Menu.Target>
								<ActionIcon aria-label="Record actions">
									<Icon path={iconDotsVertical} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown w={250}>
								<Menu.Label>Record actions</Menu.Label>
								<Menu.Item
									leftSection={<Icon path={iconRefresh} />}
									onClick={refreshRecord}
								>
									Reload record
								</Menu.Item>
								<Menu.Item
									leftSection={<Icon path={iconCopy} />}
									disabled={!allowCreate}
									onClick={() => duplicateRecord(activeRecordId)}
								>
									Duplicate record
								</Menu.Item>
								<Menu.Item
									leftSection={<Space w="lg" />}
									onClick={() => copyRecordId(activeRecordId)}
								>
									Copy Record ID
								</Menu.Item>
								<Menu.Item
									leftSection={<Space w="lg" />}
									disabled={!currentRecord.exists}
									onClick={() => copyRecordJson(activeRecordId)}
								>
									Copy as JSON
								</Menu.Item>

								<Menu.Sub
									openDelay={120}
									closeDelay={150}
									withinPortal={false}
								>
									<Menu.Sub.Target>
										<Menu.Sub.Item
											leftSection={<Icon path={iconQuery} />}
											disabled={!currentRecord.exists}
										>
											Use in query...
										</Menu.Sub.Item>
									</Menu.Sub.Target>

									<Menu.Sub.Dropdown>
										<Menu.Item
											onClick={() =>
												createQuery(activeRecordId, "SELECT * FROM")
											}
										>
											New SELECT query
										</Menu.Item>
										<Menu.Item
											onClick={() => createQuery(activeRecordId, "UPDATE")}
										>
											New UPDATE query
										</Menu.Item>
										<Menu.Item
											onClick={() => createQuery(activeRecordId, "DELETE")}
										>
											New DELETE query
										</Menu.Item>
									</Menu.Sub.Dropdown>
								</Menu.Sub>

								<Menu.Label mt="sm">Options</Menu.Label>
								<Menu.Item
									leftSection={<Icon path={iconBraces} />}
									closeMenuOnClick={false}
									onClick={handleToggleSync}
									rightSection={
										<Switch
											checked={syncContent}
											inert
										/>
									}
								>
									Live content
								</Menu.Item>

								<Menu.Label mt="sm">Dangerous</Menu.Label>
								<Menu.Item
									leftSection={<Icon path={iconDelete} />}
									onClick={() => deleteRecord(activeRecordId)}
									disabled={!currentRecord.exists}
									color="red"
									c="red"
								>
									Delete record
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					)}

					<ActionButton
						onClick={onClose}
						label="Close drawer"
					>
						<Icon path={iconClose} />
					</ActionButton>
				</Group>
			</Group>

			{isCreating && createState ? (
				<CreateTab
					table={createState.table}
					content={createState.content}
					onCreated={onClose}
				/>
			) : (
				<>
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
						leftSection={
							<Icon path={currentRecord.isEdge ? iconRelation : iconBraces} />
						}
						rightSection={currentRecord.isEdge && <Badge>Edge</Badge>}
					/>

					{currentRecord.exists ? (
						<Tabs
							mt="sm"
							value={tab}
							onChange={setTab as any}
							className={classes.tabs}
							variant="surreal"
						>
							<Tabs.List grow>
								<Tabs.Tab
									value="content"
									leftSection={<Icon path={iconBraces} />}
								>
									Content
								</Tabs.Tab>
								<Tabs.Tab
									value="incoming"
									leftSection={<Icon path={iconRelation} />}
								>
									Relations
								</Tabs.Tab>
								{supportsReferences && (
									<Tabs.Tab
										value="references"
										leftSection={<Icon path={iconArrowEnter} />}
									>
										References
									</Tabs.Tab>
								)}
								<Tabs.Tab
									value="live"
									leftSection={<Icon path={iconLive} />}
								>
									Live feed
								</Tabs.Tab>
							</Tabs.List>

							<Divider mx="-md" />

							<Tabs.Panel value="content">
								<ContentTab
									value={recordBody}
									error={error}
									saveHandle={saveHandle}
									onChange={setRecordBody}
								/>
							</Tabs.Panel>

							<Tabs.Panel value="incoming">
								<RelationsTab
									inputs={currentRecord.inputs}
									outputs={currentRecord.outputs}
								/>
							</Tabs.Panel>

							{supportsReferences && (
								<Tabs.Panel value="references">
									<ReferencesTab references={currentRecord.references} />
								</Tabs.Panel>
							)}

							<Tabs.Panel value="live">
								<LiveFeedTab
									messages={messages}
									liveSupported={liveSupported}
								/>
							</Tabs.Panel>
						</Tabs>
					) : (
						<Center my="xl">
							<Text>Record not found in database</Text>
						</Center>
					)}
				</>
			)}
		</Drawer>
	);
}
