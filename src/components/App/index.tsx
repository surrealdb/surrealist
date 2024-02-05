import { mdiClose } from "@mdi/js";
import { useHotkeys } from "@mantine/hooks";
import { MouseEvent, useEffect } from "react";
import { Notifications } from "@mantine/notifications";
import { ActionIcon, Box, Global, Group, Image, MantineProvider, Paper, Text, Transition } from "@mantine/core";

import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import surrealistIcon from "~/assets/icon.png";
import { useSurrealistTheme } from "~/util/theme";
import { DARK_THEME, LIGHT_THEME } from "~/util/editor";
import { editor } from 'monaco-editor';

import { Icon } from "../Icon";
import { adapter } from "~/adapter";
import { updateTitle } from "~/util/helpers";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { Scaffold } from "../Scaffold";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { useDatabaseStore } from "~/stores/database";
import { useExplorerStore } from "~/stores/explorer";

export function App() {
	const decreaseFontZoomLevel = useConfigStore((s) => s.decreaseFontZoomLevel);
	const increaseFontZoomLevel = useConfigStore((s) => s.increaseFontZoomLevel);
	const resetFontZoomLevel = useConfigStore((s) => s.resetFontZoomLevel);
	const toggleWindowPinned = useConfigStore((s) => s.toggleWindowPinned);

	const isLight = useIsLight();
	const update = useInterfaceStore((s) => s.availableUpdate);
	const showUpdate = useInterfaceStore((s) => s.showAvailableUpdate);
	const colorScheme = useConfigStore((s) => s.theme);
	const isPinned = useConfigStore((s) => s.isPinned);
	const defaultScheme = useInterfaceStore((s) => s.nativeTheme);
	const actualTheme = colorScheme == "automatic" ? defaultScheme : colorScheme;
	const mantineTheme = useSurrealistTheme(actualTheme);
	const hideAvailableUpdate = useInterfaceStore((s) => s.hideAvailableUpdate);

	const closeUpdate = useStable((e?: MouseEvent) => {
		e?.stopPropagation();
		hideAvailableUpdate();
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

	const togglePinned = useStable(toggleWindowPinned);

	useHotkeys([
		["mod+alt+equal", increaseFontZoomLevel],
		["mod+alt+minus", decreaseFontZoomLevel],
		["mod+alt+0", resetFontZoomLevel],
		["f11", togglePinned],
	], []);

	return (
		<MantineProvider withGlobalStyles withNormalizeCSS withCSSVariables theme={mantineTheme}>
			<Notifications />

			<ErrorBoundary
				FallbackComponent={AppErrorHandler} 
				onReset={() => {
					useConfigStore.getState().softReset();
					useDatabaseStore.getState().softReset();
					useExplorerStore.getState().softReset();
					useInterfaceStore.getState().softReset();
				}}
			>
				<Scaffold />
			</ErrorBoundary>

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

function AppErrorHandler({ error, resetErrorBoundary }: FallbackProps) {
	const message = error instanceof Error ? error.message : error;
	return (
		<div style={{
			width: '100%',
			display: 'flex',
			justifyContent: 'center',
			paddingTop: '50px',
		}}>
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
			}}>
				<h1>Something went wrong!</h1>
				{error.name && <h2>{error.name}</h2>}
				<div style={{
					padding: '0px 10px',
					border: '1px solid black'
				}}>
					<h3>Message</h3>
					<p style={{
						whiteSpace: 'pre',
						overflowX: 'auto',
						maxWidth: '90vw'
					}}>
						{message}
					</p>
				</div>
				{error.cause && (
					<div style={{
						padding: '0px 10px',
						border: '1px solid black',
						marginTop: '20px',
					}}>
						<h3>Cause</h3>
						<p style={{
							whiteSpace: 'pre',
							overflowX: 'auto',
							maxWidth: '90vw'
						}}>
							{error.cause}
						</p>
					</div>
				)}
				{error.stack && (
					<div style={{
						padding: '0px 10px',
						border: '1px solid black',
						marginTop: '20px',
					}}>
						<h3>Stack trace</h3>
						<p style={{
							whiteSpace: 'pre',
							overflowX: 'auto',
							maxWidth: '90vw',
							lineHeight: '30px',
						}}>
							{error.stack}
						</p>
					</div>
				)}
				<div style={{
					display: 'flex',
					justifyContent: 'center',
					marginTop: '40px',
				}}>
					<button onClick={resetErrorBoundary} style={{
						padding: '10px',
						background: 'black',
						color: 'white',
						border: 'none',
						cursor: 'pointer',
						fontSize: '16px',
						fontWeight: '600',
					}}>
						Reload Surrealist
					</button>
				</div>
			</div>
		</div>
	);
}