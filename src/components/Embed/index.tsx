import { Notifications } from "@mantine/notifications";
import { Box, MantineProvider } from "@mantine/core";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { MANTINE_THEME, themeColor } from "~/util/mantine";
import { useColorScheme, useIsLight } from "~/hooks/theme";
import { QueryView } from "~/views/query/QueryView";

export function Embed() {
	const colorScheme = useColorScheme();
	const isLight = useIsLight();

	return (
		<MantineProvider
			withCssVariables
			theme={MANTINE_THEME}
			forceColorScheme={colorScheme}
		>
			<Notifications />

			<ErrorBoundary
				FallbackComponent={AppErrorHandler} 
				onReset={location.reload}
			>
				<Box
					h="100vh"
					p="md"
					style={{
						backgroundColor: isLight ? themeColor("slate.0") : themeColor("slate.9")
					}}
				>
					<QueryView />
				</Box>
			</ErrorBoundary>
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