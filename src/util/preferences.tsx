import {
	DESIGNER_DIRECTIONS,
	DESIGNER_NODE_MODES,
	LINE_STYLES,
	ORIENTATIONS,
	RESULT_MODES,
	SCALE_STEPS,
	SIDEBAR_MODES,
	THEMES,
	VALUE_MODES,
} from "~/constants";

import type { Selection, SurrealistConfig } from "~/types";
import { isDesktop } from "~/adapter";
import { parseScale } from "./helpers";

type Reader<T> = (config: SurrealistConfig) => T;
type Writer<T> = (config: SurrealistConfig, value: T) => void;

export interface Preference {
	name: string;
	description: string;
	controller: BaseController<any>;
}

export interface PreferenceSection {
	name: string;
	preferences: Preference[];
}

export interface BaseController<T> {
	reader: Reader<T>;
	writer: Writer<T>;
}

/** Create a new checkbox controller */
const checkbox = (options: BaseController<boolean>) => ({ type: "checkbox", ...options }) as const;

/** Create a new numeric controller */
const number = (options: BaseController<number>) => ({ type: "number", ...options }) as const;

// /** Create a new string controller */
// const string = (options: BaseController<string>) => ({ type: "string", ...options }) as const;

/** Create a new selection controller */
const selection = <T extends string>(
	options: BaseController<T> & { options: () => Selection<T> },
) => ({ type: "select", ...options }) as const;

/** Create a new bitfield controller */
const bitfield = <T extends string>(
	options: BaseController<T[]> & { options: () => Selection<T> },
) => ({ type: "bitfield", ...options }) as const;

/**
 * Compute available preferences based on the current state
 */
export function computePreferences(): PreferenceSection[] {
	const sections: PreferenceSection[] = [];

	if (isDesktop) {
		sections.push({
			name: "Window",
			preferences: [
				{
					name: "Always on top",
					description: "Keep the window above all other windows",
					controller: checkbox({
						reader: (config) => config.settings.behavior.windowPinned,
						writer: (config, value) => {
							config.settings.behavior.windowPinned = value;
						},
					}),
				},
				{
					name: "Window scale",
					description: "The zoom level of the window",
					controller: selection({
						options: () => SCALE_STEPS,
						reader: (config) => parseScale(config.settings.appearance.windowScale),
						writer: (config, value) => {
							config.settings.appearance.windowScale = Number.parseFloat(value) / 100;
						},
					}),
				},
			],
		});
	}

	sections.push(
		{
			name: "Appearance",
			preferences: [
				{
					name: "Theme",
					description: "The color scheme of the application",
					controller: selection({
						options: () => THEMES,
						reader: (config) => config.settings.appearance.colorScheme,
						writer: (config, value) => {
							config.settings.appearance.colorScheme = value;
						},
					}),
				},
				{
					name: "Sidebar",
					description: "Control the appearance of the sidebar",
					controller: selection({
						options: () => SIDEBAR_MODES,
						reader: (config) => config.settings.appearance.sidebarMode,
						writer: (config, value) => {
							config.settings.appearance.sidebarMode = value;
						},
					}),
				},
				{
					name: "Value formatting",
					description: "The format used to display values",
					controller: selection({
						options: () => VALUE_MODES,
						reader: (config) => config.settings.appearance.valueMode,
						writer: (config, value) => {
							config.settings.appearance.valueMode = value;
						},
					}),
				},
				{
					name: "Editor scale",
					description: "The zoom level of all code editors",
					controller: selection({
						options: () => SCALE_STEPS,
						reader: (config) => parseScale(config.settings.appearance.editorScale),
						writer: (config, value) => {
							config.settings.appearance.editorScale = Number.parseFloat(value) / 100;
						},
					}),
				},
			],
		},
		{
			name: "Connection",
			preferences: [
				{
					name: "Version check timeout",
					description: "The maximum time to wait for a version check",
					controller: number({
						reader: (config) => config.settings.behavior.versionCheckTimeout,
						writer: (config, value) => {
							config.settings.behavior.versionCheckTimeout = value;
						},
					}),
				},
				{
					name: "Reconnect interval",
					description: "The time to wait before reconnecting",
					controller: number({
						reader: (config) => config.settings.behavior.reconnectInterval,
						writer: (config, value) => {
							config.settings.behavior.reconnectInterval = value;
						},
					}),
				},
			],
		},
		{
			name: "Editors",
			preferences: [
				{
					name: "Suggest table names",
					description: "Automatically suggest table names",
					controller: checkbox({
						reader: (config) => config.settings.behavior.tableSuggest,
						writer: (config, value) => {
							config.settings.behavior.tableSuggest = value;
						},
					}),
				},
				{
					name: "Suggest param names",
					description: "Automatically suggest variable names",
					controller: checkbox({
						reader: (config) => config.settings.behavior.variableSuggest,
						writer: (config, value) => {
							config.settings.behavior.variableSuggest = value;
						},
					}),
				},
				{
					name: "Line numbers",
					description: "Render line numbers in configured editors",
					controller: bitfield({
						options: () => [
							{ label: "Table names", value: "query" },
							{ label: "Param names", value: "inspector" },
							{ label: "Function names", value: "functions" },
						],
						reader: (config) => config.settings.appearance.lineNumbers,
						writer: (config, value) => {
							config.settings.appearance.lineNumbers = value;
						},
					}),
				},
			],
		},
		{
			name: "Query view",
			preferences: [
				{
					name: "Default result mode",
					description: "The default result view mode for new queries",
					controller: selection({
						options: () => RESULT_MODES,
						reader: (config) => config.settings.appearance.defaultResultMode,
						writer: (config, value) => {
							config.settings.appearance.defaultResultMode = value;
						},
					}),
				},
				{
					name: "Query validation",
					description: "Validate queries for potential issues",
					controller: checkbox({
						reader: (config) => config.settings.behavior.queryErrorChecker,
						writer: (config, value) => {
							config.settings.behavior.queryErrorChecker = value;
						},
					}),
				},
				{
					name: "Orientation",
					description: "The orientation of the query and result panels",
					controller: selection({
						options: () => ORIENTATIONS,
						reader: (config) => config.settings.appearance.queryOrientation,
						writer: (config, value) => {
							config.settings.appearance.queryOrientation = value;
						},
					}),
				},
			],
		},
		{
			name: "Designer view",
			preferences: [
				{
					name: "Line style",
					description: "The style of lines connecting nodes",
					controller: selection({
						options: () => LINE_STYLES,
						reader: (config) => config.settings.appearance.lineStyle,
						writer: (config, value) => {
							config.settings.appearance.lineStyle = value;
						},
					}),
				},
				{
					name: "Default node appearance",
					description: "The default appearance for nodes in new connection",
					controller: selection({
						options: () => DESIGNER_NODE_MODES,
						reader: (config) => config.settings.appearance.defaultDiagramMode,
						writer: (config, value) => {
							config.settings.appearance.defaultDiagramMode = value;
						},
					}),
				},
				{
					name: "Default layout direction",
					description: "The default diagram direction for new connections",
					controller: selection({
						options: () => DESIGNER_DIRECTIONS,
						reader: (config) => config.settings.appearance.defaultDiagramDirection,
						writer: (config, value) => {
							config.settings.appearance.defaultDiagramDirection = value;
						},
					}),
				},
				{
					name: "Show links",
					description: "Whether to show links between nodes",
					controller: checkbox({
						reader: (config) => config.settings.appearance.defaultDiagramShowLinks,
						writer: (config, value) => {
							config.settings.appearance.defaultDiagramShowLinks = value;
						},
					}),
				},
			],
		},
	);

	return sections;
}
