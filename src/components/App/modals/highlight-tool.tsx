import { Box, Button, Divider, Modal, Select, SimpleGrid, Stack } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CodeEditor } from "~/components/CodeEditor";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { RadioSelect } from "~/components/RadioSelect";
import { DRIVERS } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { CodeLang, type ColorScheme, type SyntaxTheme } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { renderHighlighting } from "~/util/highlighting";

function Render({
	value,
	theme,
	lang,
	syntaxTheme,
}: {
	value: string;
	theme: ColorScheme;
	lang: CodeLang;
	syntaxTheme: SyntaxTheme;
}) {
	const render = useStable(() => {
		const rendered = renderHighlighting(value, lang, theme, syntaxTheme);
		const clipboardItem = new ClipboardItem({
			"text/html": new Blob([rendered], { type: "text/html" }),
			"text/plain": new Blob([rendered], { type: "text/plain" }),
		});

		navigator.clipboard.write([clipboardItem]);
	});

	return (
		<Button
			onClick={render}
			size="xs"
			color="blue"
		>
			Copy to clipboard
		</Button>
	);
}

export function HighlightToolModal() {
	const [value, onChange] = useState("");
	const [lang, setLang] = useState<CodeLang>("cli");
	const [isOpen, openedHandle] = useBoolean();
	const [_, setFeatureFlags] = useFeatureFlags();

	const languages = useMemo(() => {
		return DRIVERS.map((driver) => ({
			label: driver.name,
			value: driver.id,
			icon: driver.icon,
		}));
	}, []);

	useEffect(() => {
		if (!isOpen) {
			onChange("");
		}
	}, [isOpen]);

	useIntent("highlight-tool", () => {
		openedHandle.open();
		setFeatureFlags({
			highlight_tool: true,
		});
	});

	return (
		<Modal
			opened={isOpen}
			onClose={openedHandle.close}
			trapFocus={false}
			withCloseButton
			size="xl"
			title={
				<>
					<PrimaryTitle flex={1}>Highlight Tool</PrimaryTitle>
					<Select
						data={languages}
						value={lang}
						onChange={setLang as any}
						mr="xl"
					/>
				</>
			}
			styles={{
				title: {
					flex: 1,
					display: "flex",
				},
			}}
		>
			<HighlightTool
				value={value}
				onChange={onChange}
				lang={lang}
			/>
		</Modal>
	);
}

interface HighlightToolProps {
	value: string;
	onChange: (value: string) => void;
	lang: CodeLang;
}

function HighlightTool({ value, onChange, lang }: HighlightToolProps) {
	const [theme, setTheme] = useState<ColorScheme>("dark");
	const syntaxTheme = useConfigStore((state) => state.settings.appearance.syntaxTheme);

	const format = useCallback(async () => {
		onChange(await getSurrealQL().formatQuery(value));
	}, [value, onChange]);

	const extensions = useMemo(() => (lang === "cli" ? [surrealql()] : []), [lang]);

	// const editorController = useEditor({
	// 	extensions,
	// 	document: value,
	// 	onChangeDocument: (document) => {
	// 		onChange(document.toString());
	// 	},
	// });

	return (
		<Stack>
			<Box>
				{/* <CodeEditor
					controller={editorController}
					h={200}
				/> */}
				<CodeEditor
					value={value}
					onChange={onChange}
					extensions={extensions}
				/>
			</Box>
			<Divider />
			<RadioSelect
				value={theme}
				onChange={setTheme as any}
				data={[
					{ value: "dark", label: "Dark theme" },
					{ value: "light", label: "Light theme" },
				]}
			/>
			<SimpleGrid cols={2}>
				<Button
					onClick={format}
					size="xs"
					color="violet"
				>
					Format
				</Button>
				<Render
					value={value}
					theme={theme}
					lang={lang}
					syntaxTheme={syntaxTheme}
				/>
			</SimpleGrid>
		</Stack>
	);
}
