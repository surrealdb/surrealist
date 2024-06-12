import { Divider, Modal, Stack } from "@mantine/core";
import { useIntent } from "~/hooks/url";
import { useEffect, useState } from "react";
import { useBoolean } from "~/hooks/boolean";
import { ModalTitle } from "~/components/ModalTitle";
import { CodeEditor } from "~/components/CodeEditor";
// @ts-ignore
import { parser } from "lezer-surrealql";
import { highlightCode, tagHighlighter } from "@lezer/highlight";
import { surrealql } from "codemirror-surrealql";
import { DARK_STYLE } from "~/util/editor/theme";
import { useFeatureFlags } from "~/util/feature-flags";


const classHighlighter = tagHighlighter(DARK_STYLE.specs.map(a => ({...a, class: a.color})));

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

	highlightCode(value, parser.parse(value), classHighlighter, emit, emitBreak);

	return (
		<div dangerouslySetInnerHTML={{ __html: rendered.innerHTML }} style={{ whiteSpace: 'pre-wrap', userSelect: 'all', background: 'black', fontFamily: "SF Mono", padding: '18px 24px', fontSize: '14px' }} />
	);
}

export function HighlightToolModal() {
	const [value, onChange] = useState("");
	const [isOpen, openedHandle] = useBoolean();
	const [_, setFeatureFlags] = useFeatureFlags();

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
				title={<ModalTitle>Highlight Tool</ModalTitle>}
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
					<Render value={value} />
				</Stack>
			</Modal>
		</>
	);
}
