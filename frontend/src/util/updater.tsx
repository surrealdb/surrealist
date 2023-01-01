import { gt } from 'semver';
import { actions, store } from '~/store';

export async function runUpdateChecker() {
	if (import.meta.env.MODE === 'development') {
		return;
	}

	try {
		const response = await fetch('https://api.github.com/repos/StarlaneStudios/Surrealist/releases/latest');
		const result = await response.json();
		const version = result.tag_name.slice(1);
		const current = import.meta.env.VERSION;

		if (gt(version, current)) {
			store.dispatch(actions.setAvailableUpdate(version));
		}
	} catch(err) {
		console.warn('Failed to check for updates', err);
	}
}