import { Button, Divider, Modal, SimpleGrid, Stack } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { useCallback, useEffect, useState } from "react";
import { s } from "surrealdb";
import { CodeEditor } from "~/components/CodeEditor";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { RadioSelect } from "~/components/RadioSelect";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import type { ColorScheme, SyntaxTheme } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { renderHighlighting } from "~/util/highlighting";
import { formatQuery } from "~/util/surrealql";

function Render({
	value,
	theme,
	syntaxTheme,
}: { value: string; theme: ColorScheme; syntaxTheme: SyntaxTheme }) {
	const render = useStable(() => {
		const rendered = renderHighlighting(value, "surrealql", theme, syntaxTheme);
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
	const [isOpen, openedHandle] = useBoolean();
	const [_, setFeatureFlags] = useFeatureFlags();
	const [theme, setTheme] = useState<ColorScheme>("dark");
	const syntaxTheme = useConfigStore((state) => state.settings.appearance.syntaxTheme);

	const format = useCallback(() => {
		onChange(formatQuery(value));
	}, [value]);

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
		<>
			<Modal
				opened={isOpen}
				onClose={openedHandle.close}
				trapFocus={false}
				withCloseButton
				size="xl"
				title={<PrimaryTitle>Highlight Tool</PrimaryTitle>}
			>
				<Stack>
					<CodeEditor
						h="50%"
						value={value}
						onChange={onChange}
						extensions={[surrealql()]}
						autoFocus
					/>
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
							color="surreal"
						>
							Format
						</Button>
						<Render
							value={value}
							theme={theme}
							syntaxTheme={syntaxTheme}
						/>
					</SimpleGrid>
				</Stack>
			</Modal>
		</>
	);
}
