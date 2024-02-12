import { ChangeEvent, useMemo } from "react";
import { mdiCheck, mdiClose, mdiTablePlus } from "@mdi/js";
import { ActionIcon, Button, Divider, Group, Text, TextInput } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { ContentPane } from "~/components/Pane";
import { Icon } from "~/components/Icon";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { getSurreal } from "~/util/surreal";
import { EventBus } from "~/hooks/event";
import { useExplorerStore } from "~/stores/explorer";

export interface CreatorPaneProps {
	refreshEvent: EventBus;
}

export function CreatorPane({ refreshEvent }: CreatorPaneProps) {
	const isLight = useIsLight();
	const creatorId = useExplorerStore((s) => s.creatorId);
	const creatorBody = useExplorerStore((s) => s.creatorBody);
	const closeEditor = useExplorerStore((s) => s.closeEditor);
	const setCreatorId = useExplorerStore((s) => s.setCreatorId);
	const setCreatorBody = useExplorerStore((s) => s.setCreatorBody);

	const handleSubmit = useStable(async () => {
		const surreal = getSurreal();

		if (!creatorId || !creatorBody || !surreal) {
			return;
		}

		await surreal.query(`CREATE ${creatorId} CONTENT ${creatorBody}`);

		closeEditor();
		refreshEvent.dispatch();
	});

	const handleCreatorId = useStable((e: ChangeEvent<HTMLInputElement>) => setCreatorId(e.target.value));
	
	const handleCreatorBody = useStable((content: string | undefined) => {
		if (creatorBody === content) {
			return;
		}

		setCreatorBody(content || "");
	});

	const handleClose = useStable(closeEditor);

	const isBodyValid = useMemo(() => {
		try {
			const json = creatorBody || "{}";
			const parsed = JSON.parse(json);

			if (typeof parsed !== "object") {
				throw new TypeError("Invalid JSON");
			}

			return true;
		} catch {
			return false;
		}
	}, [creatorBody]);

	const jsonAlert = !isBodyValid && <Text c="red">Invalid record JSON</Text>;

	return (
		<ContentPane
			title="Create Record"
			icon={mdiTablePlus}
			rightSection={
				<Group align="center">
					{jsonAlert && (
						<>
							{jsonAlert}
							<Divider orientation="vertical" color={isLight ? "light.0" : "dark.5"} />
						</>
					)}

					<ActionIcon onClick={handleClose} title="Close creator">
						<Icon color="light.4" path={mdiClose} />
					</ActionIcon>
				</Group>
			}>

			<TextInput
				mb="xs"
				label="Record name"
				value={creatorId}
				onChange={handleCreatorId}
			/>

			<Text c="dark.0" size="sm">
				Record contents
			</Text>

			<div
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: 62,
					top: 94,
				}}
			>
				<SurrealistEditor
					language="json"
					value={creatorBody}
					onChange={handleCreatorBody}
					options={{
						wrappingStrategy: "advanced",
						wordWrap: "off",
						suggest: {
							showProperties: false,
						},
					}}
				/>
			</div>

			<Button
				disabled={!isBodyValid || !creatorId}
				onClick={handleSubmit}
				style={{
					position: "absolute",
					insetInline: 12,
					bottom: 12,
				}}>
				Create record
				<Icon path={mdiCheck} right />
			</Button>
		</ContentPane>
	);
}
