import { mdiClose } from "@mdi/js";
import { useHotkeys } from "@mantine/hooks";
import { MouseEvent, useEffect } from "react";
import { Notifications } from "@mantine/notifications";
import { ActionIcon, Box, Group, Image, MantineProvider, Paper, Text, Transition } from "@mantine/core";

import { useStable } from "~/hooks/stable";
import surrealistIcon from "~/assets/surrealist.png";

import { Icon } from "../Icon";
import { adapter } from "~/adapter";
import { resetApplicationState, updateTitle } from "~/util/helpers";
import { useInterfaceStore } from "~/stores/interface";
import { useConfigStore } from "~/stores/config";
import { Scaffold } from "../Scaffold";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { MANTINE_THEME } from "~/util/mantine";
import { useColorScheme } from "~/hooks/theme";

export function App() {
	const colorScheme = useColorScheme();

	const decreaseFontZoomLevel = useConfigStore((s) => s.decreaseFontZoomLevel);
	const increaseFontZoomLevel = useConfigStore((s) => s.increaseFontZoomLevel);
	const resetFontZoomLevel = useConfigStore((s) => s.resetFontZoomLevel);
	const toggleWindowPinned = useConfigStore((s) => s.toggleWindowPinned);

	const update = useInterfaceStore((s) => s.availableUpdate);
	const showUpdate = useInterfaceStore((s) => s.showAvailableUpdate);
	const isPinned = useConfigStore((s) => s.isPinned);
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
		<MantineProvider
			withCssVariables
			theme={MANTINE_THEME}
			forceColorScheme={colorScheme}
		>
			<Notifications />

			<ErrorBoundary
				FallbackComponent={AppErrorHandler} 
				onReset={resetApplicationState}
			>
				<Scaffold />
			</ErrorBoundary>

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