import { ChangeEvent, useMemo } from "react";
import { mdiCheck, mdiClose, mdiTablePlus } from "@mdi/js";
import { ActionIcon, Button, Divider, Group, Text, TextInput } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { Panel } from "~/components/Panel";
import { Icon } from "~/components/Icon";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { store, useStoreValue } from "~/store";
import { closeEditor, setCreatorBody, setCreatorId } from "~/stores/explorer";
import { getSurreal } from "~/util/connection";
import { EventBus } from "~/hooks/event";

export interface CreatorPaneProps {
	refreshEvent: EventBus;
}

export function CreatorPane({ refreshEvent }: CreatorPaneProps) {
	const isLight = useIsLight();
	const creatorId = useStoreValue(state => state.explorer.creatorId);
	const creatorBody = useStoreValue(state => state.explorer.creatorBody);

	const handleSubmit = useStable(async () => {
		const surreal = getSurreal();

		if (!creatorId || !creatorBody || !surreal) {
			return;
		}

		await surreal.query(`CREATE ${creatorId} CONTENT ${creatorBody}`);

		store.dispatch(closeEditor());
		refreshEvent.dispatch();
	});

	const handleCreatorId = useStable((e: ChangeEvent<HTMLInputElement>) => {
		store.dispatch(setCreatorId(e.target.value));
	});
	
	const handleCreatorBody = useStable((content: string | undefined) => {
		if (creatorBody === content) {
			return;
		}

		store.dispatch(setCreatorBody(content || ""));
	});

	const handleClose = useStable(() => {
		store.dispatch(closeEditor());
	});

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

	const jsonAlert = !isBodyValid && <Text color="red">Invalid record JSON</Text>;

	return (
		<Panel
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

			<Text color="dark.0" size="sm">
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
		</Panel>
	);
}
