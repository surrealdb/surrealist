import classes from "../style.module.scss";
import { Group, Modal, SegmentedControl, Text } from "@mantine/core";
import { useMemo, useState } from "react";
import { CodeSnippet } from "~/components/CodeSnippet";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { CODE_LANGUAGES } from "~/constants";
import { CloudInstance, CodeLang, Snippets } from "~/types";
import { iconAPI } from "~/util/icons";

export interface ConnectSdkModalProps {
	opened: boolean;
	onClose: () => void;
	instance: CloudInstance;
}

export function ConnectSdkModal({
	opened,
	onClose,
	instance,
}: ConnectSdkModalProps) {
	const [lang, setLang] = useState<CodeLang>("rust");

	const snippets = useMemo<Snippets>(
		() => ({
			js: `
				await db.connect("wss://${instance.host}");
			`,
			csharp: `
				var db = new SurrealDbClient("wss://${instance.host}");
			`,
			py: `
				await db.connect('https://${instance.host}/rpc')
			`,
			php: `
				$db->connect("wss://${instance.host}");
			`,
			rust: `
				let db = any::connect("wss://${instance.host}").await?;
			`
		}),
		[instance]
	);

	const languages = CODE_LANGUAGES.filter((lang) => snippets[lang.value]);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			trapFocus={false}
			withCloseButton
			size="lg"
			title={
				<Group>
					<Icon path={iconAPI} size="xl" />
					<PrimaryTitle>Connect with an SDK</PrimaryTitle>
				</Group>
			}
		>
			<Text size="lg">
				You can connect to this instance with your preferred language using one of our SurrealDB Client SDKs.
			</Text>

			<SegmentedControl
				data={languages}
				value={lang}
				onChange={setLang as any}
				className={classes.langSwitcher}
				fullWidth
				my="xl"
			/>

			<CodeSnippet
				language={lang}
				values={snippets}
			/>
		</Modal>
	);
}