import { useCallback, useEffect } from "react";
import { OpenConnectionsDialog, OpenDownloadDialog, OpenHelpDialog, OpenNewConnectionDialog, OpenSettingsDialog } from "./global-events";
import { useConfigStore } from "~/stores/config";

const paths = {
	help: OpenHelpDialog.dispatch,
	download: OpenDownloadDialog.dispatch,
	settings: OpenSettingsDialog.dispatch,
	connections: OpenConnectionsDialog.dispatch,
	'new-connection': OpenNewConnectionDialog.dispatch,
};

export function useUrlHandler() {
	const activeView = useConfigStore((s) => s.activeView);
	const { setActiveView } = useConfigStore.getState();

	const handler = useCallback(() => {
		if (!history.state?.skipUrlHandler) {
			const url = location.pathname.toLowerCase();
			switch (true) {
				case url === '/':
				case url.startsWith('/query'): {
					setActiveView('query');
					break;
				}

				case url.startsWith('/explorer'): {
					setActiveView('explorer');
					break;
				}

				case url.startsWith('/designer'): {
					setActiveView('designer');
					break;
				}

				case url.startsWith('/authentication'): {
					setActiveView('authentication');
					break;
				}
			}

			const trigger = new URLSearchParams(location.search).get('trigger') ?? '';
			const [path, arg] = trigger.split('=');
			const resolved = path.split(':').reduce<Record<string, unknown> | ((arg: any) => void)>(
				(prev, curr) => typeof prev == 'object' && curr in prev ? prev[curr] as Record<string, unknown> : {}, paths
			);

			if (typeof resolved === 'function') {
				resolved(arg);
			}
		}
	}, []);

	useEffect(() => {
		window.addEventListener('hashchange', handler);
		window.addEventListener('locationchange', handler);

		return () => {
			window.removeEventListener('hashchange', handler);
			window.removeEventListener('locationchange', handler);
		};
	}, [handler]);

	useEffect(() => {
		const url = location.pathname.toLowerCase();
		const updated = `/${activeView}`;
		if (activeView == 'query') {
			if (url != '/' && !url.startsWith(updated)) {
				history.replaceState({ skipUrlHandler: true }, document.title, '/');
			}
		} else if (!url.startsWith(updated)) {
			history.replaceState({ skipUrlHandler: true }, document.title, updated);
		}
	}, [activeView]);

	useEffect(() => {
		// First time when window loads
		handler();
	}, []);
}
