import surrealistIcon from "~/assets/images/logo.png";
import { useHotkeys } from "@mantine/hooks";
import { MouseEvent } from "react";
import { Notifications } from "@mantine/notifications";
import { ActionIcon, Box, Group, Image, MantineProvider, Paper, Text, Transition } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { Icon } from "../Icon";
import { adapter } from "~/adapter";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { Scaffold } from "../Scaffold";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { MANTINE_THEME } from "~/util/mantine";
import { useColorScheme, useIsLight } from "~/hooks/theme";
import { ContextMenuProvider } from "mantine-contextmenu";
import { InspectorProvider } from "~/providers/Inspector";
import { iconClose } from "~/util/icons";
import { getSetting } from "~/util/config";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { ConfirmationProvider } from "~/providers/Confirmation";
import { useUrlHandler } from "~/hooks/url";

export function App() {
	const { softReset, updateBehaviorSettings, updateAppearanceSettings } = useConfigStore.getState();
	const { hideAvailableUpdate } = useInterfaceStore.getState();

	const isLight = useIsLight();
	const colorScheme = useColorScheme();
	const update = useInterfaceStore((s) => s.availableUpdate);
	const showUpdate = useInterfaceStore((s) => s.showAvailableUpdate);

	const closeUpdate = useStable((e?: MouseEvent) => {
		e?.stopPropagation();
		hideAvailableUpdate();
	});

	const openRelease = useStable(() => {
		adapter.openUrl(`https://github.com/surrealdb/surrealist/releases/tag/v${update}`);
		closeUpdate();
	});

	const updateWindowScale = (delta: number) => {
		updateAppearanceSettings({
			windowScale: getSetting("appearance", "windowScale") + delta
		});
	};

	const updateEditorScale = (delta: number) => {
		updateAppearanceSettings({
			editorScale: getSetting("appearance", "editorScale") + delta
		});
	};

	const toggleWindowPinned = () => {
		updateBehaviorSettings({
			windowPinned: !getSetting("behavior", "windowPinned")
		});
	};

	useHotkeys([
		["mod+equal", () => updateWindowScale(10)],
		["mod+minus", () => updateWindowScale(-10)],
		["mod+shift+equal", () => updateEditorScale(10)],
		["mod+shift+minus", () => updateEditorScale(-10)],
		["f10", toggleWindowPinned],
	], []);

	useUrlHandler();

	return (
		<FeatureFlagsProvider>
			<MantineProvider
				withCssVariables
				theme={MANTINE_THEME}
				forceColorScheme={colorScheme}
			>
				<Notifications />

				<ContextMenuProvider
					borderRadius="md"
					shadow={isLight ? "xs" : "0 6px 12px 2px rgba(0, 0, 0, 0.25)"}
					submenuDelay={250}
				>
					<ConfirmationProvider>
						<InspectorProvider>
							<ErrorBoundary
								FallbackComponent={AppErrorHandler}
								onReset={softReset}
							>
								<Scaffold />
							</ErrorBoundary>
						</InspectorProvider>
					</ConfirmationProvider>
				</ContextMenuProvider>

				<Transition
					mounted={showUpdate}
					duration={250}
					transition="slide-up"
					timingFunction="ease"
				>
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
							<Group gap="sm">
								<Image
									src={surrealistIcon}
									style={{ pointerEvents: "none" }}
									height={32}
									width={32}
									mx={4}
								/>
								<Box miw={200}>
									<Text c="white">New release available</Text>
									<Text c="gray.5">Version {update} is available</Text>
								</Box>
								<ActionIcon onClick={closeUpdate}>
									<Icon path={iconClose} />
								</ActionIcon>
							</Group>
						</Paper>
					)}
				</Transition>
			</MantineProvider>
		</FeatureFlagsProvider>
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
