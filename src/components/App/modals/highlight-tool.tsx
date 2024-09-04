// @ts-ignore
import { parser } from "@surrealdb/lezer";
import { Button, Divider, Modal, Stack } from "@mantine/core";
import { useIntent } from "~/hooks/url";
import { useCallback, useEffect, useState } from "react";
import { useBoolean } from "~/hooks/boolean";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { CodeEditor } from "~/components/CodeEditor";
import { highlightCode } from "@lezer/highlight";
import { surrealql } from "@surrealdb/codemirror";
import { useFeatureFlags } from "~/util/feature-flags";
import { formatQuery } from "~/util/surrealql";
import { CLASS_HIGHLIGHTER } from "~/editor";

export function Render({ value }: { value: string }) {
	const rendered = document.createElement('div');

	function emit(text: string, classes?: string) {
		const textNode = document.createTextNode(text);

		if (classes) {
			const span = document.createElement('span');
			span.style.color = classes;
			span.append(textNode);
			rendered.append(span);
		} else {
			rendered.append(textNode);
		}
	}

	function emitBreak() {
		emit("\n");
	}

	highlightCode(value, parser.parse(value), CLASS_HIGHLIGHTER, emit, emitBreak);

	return (
		<div dangerouslySetInnerHTML={{ __html: rendered.innerHTML }} style={{ whiteSpace: 'pre-wrap', userSelect: 'all', background: 'black', fontFamily: "SF Mono", padding: '18px 24px', fontSize: '14px' }} />
	);
}

export function HighlightToolModal() {
	const [value, onChange] = useState("");
	const [isOpen, openedHandle] = useBoolean();
	const [_, setFeatureFlags] = useFeatureFlags();

	const format = useCallback(() => {
		onChange(formatQuery(value));
	}, [onChange, value]);

	useEffect(() => {
		if (!isOpen) {
			onChange('');
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
					<Button onClick={format}>Format</Button>
					<Divider />
					<Render value={value} />
				</Stack>
			</Modal>
		</>
	);
}
