import "./adapter";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import embedPath from './generated/surrealist-embed_bg.wasm?url';
import initEmbed, { initialize_embed } from './generated/surrealist-embed';
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { initializeMonaco } from "./util/editor";
import { runUpdateChecker } from "./util/updater";
import { updateTitle, watchNativeTheme } from "./util/helpers";
import { adapter } from "./adapter";
import { useConfigStore } from "./stores/config";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

import "reactflow/dist/style.css";
import { useDatabaseStore } from "./stores/database";
import { useExplorerStore } from "./stores/explorer";
import { useInterfaceStore } from "./stores/interface";

(async () => {
	dayjs.extend(relativeTime);

	// Load the surrealist embed library
	await initEmbed(embedPath);

	initialize_embed();

	// Check for updates
	const { lastPromptedVersion, updateChecker } = useConfigStore.getState();
	if (adapter.isUpdateCheckSupported && updateChecker) {
		runUpdateChecker(lastPromptedVersion, false);
	}

	// // Apply initial title
	updateTitle();

	// Listen for theme changes
	watchNativeTheme();

	// Init monaco
	await document.fonts.ready;
	await initializeMonaco();

	// Render the app component
	const root = document.querySelector("#root")!;

	createRoot(root).render(<App />);
		<ErrorBoundary 
			FallbackComponent={ErrorBoundaryFallback} 
			onReset={() => {
				useConfigStore.getState().softReset();
				useDatabaseStore.getState().softReset();
				useExplorerStore.getState().softReset();
				useInterfaceStore.getState().softReset();
			}}
		>
			<App />
		</ErrorBoundary>
	);
})();

function ErrorBoundaryFallback({ error, resetErrorBoundary }: FallbackProps) {
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
