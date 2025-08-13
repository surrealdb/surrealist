import {
	ActionIcon,
	Box,
	Button,
	Drawer,
	Group,
	SegmentedControl,
	Stack,
	Title,
	Tooltip,
} from "@mantine/core";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { LoadingContainer } from "~/components/LoadingContainer";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import { iconBook, iconClose, iconMarker } from "~/util/icons";
import { formatValue, parseValue } from "~/util/surrealql";
import type { GeographyInput } from "../GeographyMap";
import { openGeometryLearnModal } from "~/modals/geometry-learn";
import { useStable } from "~/hooks/stable";
import { GeographyDrawerEditor } from "./editor";
import { getGeometryTypeName, normalizeGeometry } from "./helpers";
import { CodeEditor } from "~/components/CodeEditor";
import { surrealql } from "@surrealdb/codemirror";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { RecordsChangedEvent, SetQueryEvent } from "~/util/global-events";
import { showErrorNotification } from "~/util/helpers";
import { StringRecordId } from "surrealdb";

const GeographyMap = lazy(() => import("../GeographyMap"));

export interface GeographyDrawerProps {
	opened: boolean;
	data: GeographyInput;
	onClose: () => void;
	/** Optional: record to update, e.g. "table:id" */
	recordId?: string;
	/** Optional: field path to set on the record, e.g. "location" or "profile.location" */
	field?: string;
	/** Optional: invoked after a successful apply */
	onApplied?: (value: GeographyInput) => void;
}

export function GeographyDrawer({
	opened,
	data,
	onClose,
	recordId,
	field,
	onApplied,
}: GeographyDrawerProps) {
	const [width, setWidth] = useState<number>(650);
	const [initialData, setInitialData] = useState<GeographyInput>(data);
	const [hasChanges, setHasChanges] = useState<boolean>(false);
	const [mode, setMode] = useState<"editor" | "code">("editor");
	const [codeValue, setCodeValue] = useState<string>(
		() => formatValue(data, false, true) as string,
	);

	const revert = useStable(() => {
		setInitialData(data);
		setCodeValue(formatValue(data, false, true) as string);
		setHasChanges(false);
	});

	const doPersist = useStable(async (closeAfter: boolean) => {
		try {
			const value = normalizeGeometry(initialData);

			if (recordId && field) {
				const id = new StringRecordId(recordId);
				const [{ success, result }] = await executeQuery(
					/* surql */ `UPDATE $id SET ${field} = $value`,
					{ id, value },
				);

				if (!success) {
					showErrorNotification({
						title: "Failed to apply geometry",
						content: String(result).replace(
							"There was a problem with the database: ",
							"",
						),
					});
					return;
				}

				RecordsChangedEvent.dispatch(null);
				onApplied?.(value);
				setHasChanges(false);

				if (closeAfter) {
					onClose();
				}
				return;
			}

			// Fallback: prefill active query editor with an UPDATE snippet
			const formatted = formatValue(value) as string;
			const query = `-- Set the target table:id and field before running\nUPDATE your_table:your_id SET your_field = ${formatted};`;
			SetQueryEvent.dispatch(query);
			setHasChanges(false);
			if (closeAfter) {
				onClose();
			}
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to apply geometry",
				content: err,
			});
		}
	});

	const apply = useStable(() => doPersist(false));

	const save = useStable(() => doPersist(true));

	// Keep code editor value in sync when visual editor changes.
	// Avoid updating while in code mode to prevent cursor jumps and value thrashing.
	useEffect(() => {
		if (mode === "editor") {
			setCodeValue(formatValue(initialData, false, true) as string);
		}
	}, [initialData, mode]);

	const codeExtensions = useMemo(() => [surrealql()], []);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			onClick={ON_STOP_PROPAGATION}
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
				<PrimaryTitle
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Icon left path={iconMarker} size="sm" />
					Geography explorer
				</PrimaryTitle>

				<Spacer />

				<Group align="center">
					<Tooltip label="Learn more about geometries">
						<Button
							variant="light"
							color="slate"
							size="xs"
							radius="xs"
							leftSection={<Icon path={iconBook} />}
							onClick={openGeometryLearnModal}
						>
							Learn more
						</Button>
					</Tooltip>
					<ActionIcon onClick={onClose} aria-label="Close geography drawer">
						<Icon path={iconClose} />
					</ActionIcon>
				</Group>
			</Group>
			<Stack flex={1} gap={6} style={{ flexShrink: 1, flexBasis: 0 }}>
				<Box flex={1} style={{ minHeight: 350 }}>
					<Suspense fallback={<LoadingContainer visible />}>
						<GeographyMap value={formatValue(initialData)} />
					</Suspense>
				</Box>
				<Box mt="xl">
					<Group justify="space-between" align="center">
						<Title size={24}>{getGeometryTypeName(initialData)} editor</Title>
						<SegmentedControl
							size="xs"
							radius="xs"
							variant="gradient"
							value={mode}
							onChange={(v) => setMode(v as any)}
							data={[
								{ label: "Editor", value: "editor" },
								{ label: "Code", value: "code" },
							]}
						/>
					</Group>
				</Box>
				<Box mt="xl" h="100%" flex={1} pos="relative">
					{mode === "editor" ? (
						<GeographyDrawerEditor
							value={initialData}
							onChange={(val) => {
								setInitialData(val);
								setHasChanges(true);
							}}
						/>
					) : (
						<CodeEditor
							value={codeValue}
							onChange={(value) => {
								setCodeValue(value);
								setInitialData(parseValue(value));
								setHasChanges(true);
							}}
							autoFocus
							lineNumbers
							extensions={codeExtensions}
							style={{ height: "100%" }}
						/>
					)}
				</Box>
				<Group my="xl">
					<Button disabled={!hasChanges} onClick={revert}>
						Revert changes
					</Button>
					<Spacer />
					<Button disabled={!hasChanges} onClick={apply}>
						Apply
					</Button>
					<Button variant="gradient" disabled={!hasChanges} onClick={save}>
						Save
					</Button>
				</Group>
			</Stack>
		</Drawer>
	);
}
