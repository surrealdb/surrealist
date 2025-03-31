import {
	Box,
	Checkbox,
	Group,
	type MantineColorScheme,
	Select,
	Stack,
	Tooltip,
} from "@mantine/core";

import { type PropsWithChildren, type ReactNode, useEffect, useLayoutEffect, useMemo } from "react";

import { Text } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { useImmer } from "use-immer";
import { Icon } from "~/components/Icon";
import { CodeInput } from "~/components/Inputs";
import { Spacer } from "~/components/Spacer";
import { DATASETS, ORIENTATIONS, RESULT_MODES, THEMES } from "~/constants";
import type { ColorScheme, Orientation, ResultMode } from "~/types";
import { isDevelopment, isProduction } from "~/util/environment";
import { iconHelp } from "~/util/icons";

export const DEFAULT_STATE: EmbedState = {
	dataset: "none",
	setup: "",
	query: "",
	theme: "auto",
	variables: "{}",
	orientation: "vertical",
	transparent: false,
	linenumbers: false,
	autorun: false,
	resultmode: "combined",
};

const DATASET_OPTIONS = [
	{ label: "None", value: "none" },
	...Object.entries(DATASETS).map(([id, { name }]) => ({
		label: name,
		value: id,
	})),
];

function SectionTitle({
	children,
	help,
	extra,
}: PropsWithChildren<{ help?: string; extra?: ReactNode }>) {
	return (
		<Group
			mb="sm"
			gap="xs"
		>
			<Text
				fw={600}
				fz="lg"
				c="bright"
			>
				{children}
			</Text>
			{help && (
				<Tooltip
					label={help}
					openDelay={300}
				>
					<Box>
						<Icon
							path={iconHelp}
							size="sm"
						/>
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
	theme: MantineColorScheme;
	orientation: Orientation;
	transparent?: boolean;
	linenumbers?: boolean;
	autorun?: boolean;
	resultmode?: ResultMode;
}

export interface EmbedderProps {
	value?: EmbedState;
	onChangeURL?: (url: string) => void;
}

export function Embedder({ value, onChangeURL }: EmbedderProps) {
	const [state, setState] = useImmer({ ...DEFAULT_STATE, ...value });

	useEffect(() => {
		if (value) {
			setState(value);
		}
	}, [value]);

	const frameUrl = useMemo(() => {
		const search = new URLSearchParams();
		const {
			dataset,
			setup,
			query,
			variables,
			orientation,
			theme,
			transparent,
			linenumbers,
			autorun,
			resultmode,
		} = state;

		if (setup.length > 0) {
			search.append("setup", setup);
		}

		if (query.length > 0) {
			search.append("query", query);
		}

		if (variables !== "{}") {
			search.append("variables", variables);
		}

		if (dataset !== "none") {
			search.append("dataset", dataset);
		}

		if (orientation !== "vertical") {
			search.append("orientation", orientation);
		}

		if (theme !== "dark") {
			search.append("theme", theme);
		}

		if (transparent) {
			search.append("transparent", "true");
		}

		if (linenumbers) {
			search.append("linenumbers", "true");
		}

		if (autorun) {
			search.append("autorun", "true");
		}

		if (resultmode) {
			search.append("resultmode", resultmode);
		}

		const url = new URL(location.toString());

		if (isProduction) {
			url.protocol = "https:";
			url.hostname = "surrealist.app";
			url.port = "";
		}

		url.pathname = isDevelopment ? "tools/mini-embed.html" : "mini";
		url.search = search.toString();

		return url.toString();
	}, [state]);

	useLayoutEffect(() => {
		onChangeURL?.(frameUrl);
	}, [frameUrl, onChangeURL]);

	return (
		<Stack gap="lg">
			<Box>
				<SectionTitle help="The query placed into the query editor">
					Editor query
				</SectionTitle>
				<CodeInput
					multiline
					autoFocus
					value={state.query}
					placeholder="SELECT * FROM something..."
					onChange={(e) => {
						setState((draft) => {
							draft.query = e;
						});
					}}
					extensions={[surrealql()]}
				/>
			</Box>
			<Box>
				<SectionTitle help="The variables placed into the query editor">
					Editor variables
				</SectionTitle>
				<CodeInput
					multiline
					value={state.variables}
					onChange={(e) => {
						setState((draft) => {
							draft.variables = e;
						});
					}}
					extensions={[surrealql()]}
				/>
			</Box>
			<Box>
				<SectionTitle help="The query executed when loading the mini. Useful for inserting pre-existing records">
					Setup query
				</SectionTitle>
				<CodeInput
					multiline
					value={state.setup}
					placeholder="CREATE something..."
					onChange={(e) => {
						setState((draft) => {
							draft.setup = e;
						});
					}}
					extensions={[surrealql()]}
				/>
			</Box>
			<Box>
				<SectionTitle help="An official SurrealDB dataset to load into the mini on load">
					Dataset
				</SectionTitle>
				<Select
					data={DATASET_OPTIONS}
					value={state.dataset}
					onChange={(e) => {
						setState((draft) => {
							draft.dataset = e || "";
						});
					}}
				/>
			</Box>
			<Box>
				<SectionTitle help="The visual orientation of the mini">Orientation</SectionTitle>
				<Select
					data={ORIENTATIONS}
					value={state.orientation}
					onChange={(e) => {
						setState((draft) => {
							draft.orientation = e as Orientation;
						});
					}}
				/>
			</Box>
			<Box>
				<SectionTitle help="The color scheme used by the mini">Color scheme</SectionTitle>
				<Select
					data={THEMES}
					value={state.theme}
					onChange={(e) => {
						setState((draft) => {
							draft.theme = e as ColorScheme;
						});
					}}
				/>
			</Box>
			<Box>
				<SectionTitle help="The default selected result mode">Result mode</SectionTitle>
				<Select
					data={RESULT_MODES}
					value={state.resultmode}
					onChange={(e) => {
						setState((draft) => {
							draft.resultmode = e as ResultMode;
						});
					}}
				/>
			</Box>
			<Box>
				<SectionTitle help="Miscellaneous options for the mini">Options</SectionTitle>
				<Stack>
					<Checkbox
						label="Transparent"
						checked={state.transparent}
						onChange={(e) => {
							setState((draft) => {
								draft.transparent = e.target.checked;
							});
						}}
					/>
					<Checkbox
						label="Show line numbers"
						checked={state.linenumbers}
						onChange={(e) => {
							setState((draft) => {
								draft.linenumbers = e.target.checked;
							});
						}}
					/>
					<Checkbox
						label="Automatically run query"
						checked={state.autorun}
						onChange={(e) => {
							setState((draft) => {
								draft.autorun = e.target.checked;
							});
						}}
					/>
				</Stack>
			</Box>
		</Stack>
	);
}
