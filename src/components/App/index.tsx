import { mdiClose } from "@mdi/js";
import { useHotkeys } from "@mantine/hooks";
import { MouseEvent, useEffect } from "react";
import { Notifications } from "@mantine/notifications";
import { ActionIcon, Box, Global, Group, Image, MantineProvider, Paper, Text, Transition } from "@mantine/core";

import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import surrealistIcon from "~/assets/icon.png";
import { useSurrealistTheme } from "~/util/theme";
import { store, useStoreValue } from "~/store";
import { DARK_THEME, LIGHT_THEME } from "~/util/editor";
import { editor } from 'monaco-editor';

import { Icon } from "../Icon";
import { adapter } from "~/adapter";
import { updateTitle } from "~/util/helpers";
import { hideAvailableUpdate } from "~/stores/interface";
import { decreaseFontZoomLevel, increaseFontZoomLevel, resetFontZoomLevel, toggleWindowPinned } from "~/stores/config";
import { RouterProvider } from "react-router-dom";

export interface AppProps {
	router: any;
}

export function App({ router }: AppProps) {
	const isLight = useIsLight();
	const update = useStoreValue((state) => state.interface.availableUpdate);
	const showUpdate = useStoreValue((state) => state.interface.showAvailableUpdate);
	const colorScheme = useStoreValue((state) => state.config.theme);
	const isPinned = useStoreValue((state) => state.config.isPinned);
	const defaultScheme = useStoreValue((state) => state.interface.nativeTheme);
	const actualTheme = colorScheme == "automatic" ? defaultScheme : colorScheme;
	const mantineTheme = useSurrealistTheme(actualTheme);

	const closeUpdate = useStable((e?: MouseEvent) => {
		e?.stopPropagation();
		store.dispatch(hideAvailableUpdate());
	});

	const openRelease = useStable(() => {
		adapter.openUrl(`https://github.com/StarlaneStudios/Surrealist/releases/tag/v${update}`);
		closeUpdate();
	});

	useEffect(() => {
		updateTitle();
	}, []);

	useEffect(() => {
		editor.setTheme(isLight ? LIGHT_THEME : DARK_THEME);
	}, [colorScheme]);
 
	useEffect(() => {
		if (adapter.isPinningSupported) {
			adapter.setWindowPinned(isPinned);
			updateTitle();
		}
	}, [isPinned]);

	const togglePinned = useStable(() => {
		store.dispatch(toggleWindowPinned());
	});

	const fontZoomInstructions = {
		increase: () => store.dispatch(increaseFontZoomLevel()),
		decrease: () => store.dispatch(decreaseFontZoomLevel()),
		reset: () => store.dispatch(resetFontZoomLevel()),
	};

	useHotkeys([
		["ctrl+alt+equal", fontZoomInstructions.increase],
		["cmd+alt+equal", fontZoomInstructions.increase],

		["ctrl+alt+minus", fontZoomInstructions.decrease],
		["cmd+alt+minus", fontZoomInstructions.decrease],

		["ctrl+alt+0", fontZoomInstructions.reset],
		["cmd+alt+0", fontZoomInstructions.reset],

		["f11", togglePinned],
	], []);

	return (
		<MantineProvider withGlobalStyles withNormalizeCSS withCSSVariables theme={mantineTheme}>
			<Notifications />
			
			<RouterProvider router={router} />

			<Transition mounted={showUpdate} duration={250} transition="slide-up" timingFunction="ease">
				{(styles) => (
					<Paper
						onClick={openRelease}
						style={{ ...styles, cursor: "pointer" }}
						pos="fixed"
						bg="#2f2f40"
						bottom={20}
						left={20}
						p="xs"
					>
						<Group spacing="sm">
							<Image src={surrealistIcon} style={{ pointerEvents: "none" }} height={32} width={32} mx={4} />
							<Box miw={200}>
								<Text c="white">New release available</Text>
								<Text c="gray.5">Version {update} is available</Text>
							</Box>
							<ActionIcon onClick={closeUpdate}>
								<Icon path={mdiClose} />
							</ActionIcon>
						</Group>
					</Paper>
				)}
			</Transition>

			{/* Font registration */}
			<Global
				styles={[
					// Montserrat Regular
					{
						"@font-face": {
							fontFamily: "Montserrat",
							src: `url('/Montserrat-Regular.ttf')`,
							fontWeight: 400,
						},
					},
					{
						"@font-face": {
							fontFamily: "Montserrat",
							src: `url('/Montserrat-Medium.ttf')`,
							fontWeight: 500,
						},
					},
					{
						"@font-face": {
							fontFamily: "Montserrat",
							src: `url('/Montserrat-SemiBold.ttf')`,
							fontWeight: 600,
						},
					},
					{
						"@font-face": {
							fontFamily: "Montserrat",
							src: `url('/Montserrat-Bold.ttf')`,
							fontWeight: 700,
						},
					},

					// Montserrat Italic
					{
						"@font-face": {
							fontFamily: "Montserrat",
							src: `url('/Montserrat-RegularItalic.ttf')`,
							fontWeight: 400,
							fontStyle: "italic",
						},
					},
					{
						"@font-face": {
							fontFamily: "Montserrat",
							src: `url('/Montserrat-MediumItalic.ttf')`,
							fontWeight: 500,
							fontStyle: "italic",
						},
					},
					{
						"@font-face": {
							fontFamily: "Montserrat",
							src: `url('/Montserrat-SemiBoldItalic.ttf')`,
							fontWeight: 600,
							fontStyle: "italic",
						},
					},
					{
						"@font-face": {
							fontFamily: "Montserrat",
							src: `url('/Montserrat-BoldItalic.ttf')`,
							fontWeight: 700,
							fontStyle: "italic",
						},
					},

					// JetBrains Mono Regular
					{
						"@font-face": {
							fontFamily: "JetBrains Mono",
							src: `url('/JetBrainsMono-Regular.ttf')`,
							fontWeight: 400,
						},
					},
					{
						"@font-face": {
							fontFamily: "JetBrains Mono",
							src: `url('/JetBrainsMono-Bold.ttf')`,
							fontWeight: 700,
						},
					},

					// JetBrains Mono Italic
					{
						"@font-face": {
							fontFamily: "JetBrains Mono",
							src: `url('/JetBrainsMono-RegularItalic.ttf')`,
							fontWeight: 400,
							fontStyle: "italic",
						},
					},
					{
						"@font-face": {
							fontFamily: "JetBrains Mono",
							src: `url('/JetBrainsMono-BoldItalic.ttf')`,
							fontWeight: 700,
							fontStyle: "italic",
						},
					},
				]}
			/>

			{/* Global styles */}
			<Global
				styles={{
					"html, body, #root": {
						height: "100%",
					},
					body: {
						backgroundColor: isLight ? "#f0f1fa" : "#09090a",
						fontWeight: 500,
					},
					".__dbk__container": {
						overflow: "visible",
					},
				}}
			/>
		</MantineProvider>
	);
}
