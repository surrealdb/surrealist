import dedent from "dedent";
import { html } from "@codemirror/lang-html";
import { Box, Divider, Group, SegmentedControl, Select, Stack, Tooltip } from "@mantine/core";
import { useImmer } from "use-immer";
import { Orientation } from "~/types";
import { Text } from "@mantine/core";
import { surrealql } from "codemirror-surrealql";
import { DATASETS, ORIENTATIONS } from "~/constants";
import { CodeInput } from "../Inputs";
import { PropsWithChildren, ReactNode, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { isDevelopment, isProduction } from "~/util/environment";
import { Icon } from "../Icon";
import { iconHelp } from "~/util/icons";
import { CodePreview } from "../CodePreview";
import { Spacer } from "../Spacer";

export const DEFAULT_STATE: EmbedState = {
	dataset: "none",
	setup: "",
	query: "",
	variables: "{}",
	orientation: "vertical"
};

const DATASET_OPTIONS = [
	{ label: "None", value: "none" },
	...Object.entries(DATASETS).map(([id, { name }]) => ({
		label: name,
		value: id
	}))
];

function SectionTitle({ children, help, extra }: PropsWithChildren<{ help?: string, extra?: ReactNode }>) {
	return (
		<Group mb="sm" gap="xs">
			<Text fw={600} fz="lg" c="bright">
				{children}
			</Text>
			{help && (
				<Tooltip label={help}>
					<Box>
						<Icon path={iconHelp} size="sm" />
					</Box>
				</Tooltip>
			)}
			{extra && (
				<>
					<Spacer />
					{extra}
				</>
			)}
		</Group>
	);
}

export interface EmbedState {
	dataset: string;
	setup: string;
	query: string;
	variables: string;
	orientation: Orientation;
}

export interface EmbedderProps {
	value?: EmbedState;
	onChangeURL?: (url: string) => void;
}

export function Embedder({
	value,
	onChangeURL,
}: EmbedderProps) {
	const [state, setState] = useImmer({...DEFAULT_STATE, ...value});
	const [mode, setMode] = useState("Embed");

	useEffect(() => {
		if (value) {
			setState(value);
		}
	}, [value]);

	const frameUrl = useMemo(() => {
		const search = new URLSearchParams();
		const { dataset, setup, query, variables, orientation } = state;

		if (setup.length > 0) {
			search.append('setup', setup);
		}

		if (query.length > 0) {
			search.append('query', query);
		}

		if (variables !== "{}") {
			search.append('variables', variables);
		}

		if (dataset !== "none") {
			search.append('dataset', dataset);
		}

		if (orientation !== 'vertical') {
			search.append('orientation', orientation);
		}

		const url = new URL(location.toString());

		if (isProduction && !url.hostname.endsWith("surrealist.app")) {
			url.hostname = "surrealist.app";
			url.port = "";
		}

		url.pathname = isDevelopment ? 'mini/run.html' : 'mini';
		url.search = search.toString();

		return url.toString();
	}, [state]);

	const snippetCode = useMemo(() => {
		return dedent(`
			<iframe
				width="750"
				height="500"
				src="${frameUrl}"
				title="Surrealist Mini"
				frameborder="0" 
				referrerpolicy="strict-origin-when-cross-origin">
			</iframe>
		`);
	}, [frameUrl]);

	useLayoutEffect(() => {
		onChangeURL?.(frameUrl);
	}, [frameUrl]);

	return (
		<Stack gap="lg">
			<Text>
				This form allows you to build a sharable mini version of Surrealist pre-loaded with
				configured values, such as queries, variables, and other settings. You can use these
				embeds in your blog posts, documentation, or other places where you want to share
				interactive SurrealDB queries.
			</Text>
			<Box>
				<SectionTitle help="The query placed into the query editor">
					Editor query
				</SectionTitle>
				<CodeInput
					multiline
					autoFocus
					value={state.query}
					placeholder="SELECT * FROM something..."
					onChange={e => {
						setState(draft => {
							draft.query = e;
						});
					}}
					extensions={[
						surrealql()
					]}
				/>
			</Box>
			<Box>
				<SectionTitle help="The variables placed into the query editor">
					Editor variables
				</SectionTitle>
				<CodeInput
					multiline
					value={state.variables}
					onChange={e => {
						setState(draft => {
							draft.variables = e;
						});
					}}
					extensions={[
						surrealql()
					]}
				/>
			</Box>
			<Box>
				<SectionTitle help="The query executed when loading the embed. Useful for inserting pre-existing records">
					Setup query
				</SectionTitle>
				<CodeInput
					multiline
					value={state.setup}
					placeholder="CREATE something..."
					onChange={e => {
						setState(draft => {
							draft.setup = e;
						});
					}}
					extensions={[
						surrealql()
					]}
				/>
			</Box>
			<Box>
				<SectionTitle help="An official SurrealDB dataset to load into the embed on load">
					Dataset
				</SectionTitle>
				<Select
					data={DATASET_OPTIONS}
					value={state.dataset}
					onChange={e => {
						setState(draft => {
							draft.dataset = e  || '';
						});
					}}
				/>
			</Box>
			<Box>
				<SectionTitle help="The visual orientation of the embed">
					Orientation
				</SectionTitle>
				<Select
					data={ORIENTATIONS}
					value={state.orientation}
					onChange={e => {
						setState(draft => {
							draft.orientation = e as Orientation;
						});
					}}
				/>
			</Box>
			<Divider />
			<Box>
				<SectionTitle extra={
					<SegmentedControl
						data={['Embed', 'URL']}
						value={mode}
						onChange={setMode}
						radius="xs"
					/>
				}>
					Embed snippet
				</SectionTitle>
				<CodePreview
					value={mode === 'Embed' ? snippetCode : frameUrl}
					withCopy
					extensions={mode === 'Embed' ? [
						html()
					] : []}
				/>
			</Box>
		</Stack>
	);
}