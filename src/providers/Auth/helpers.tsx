import { isDevelopment } from "~/util/environment";

const CALLBACK_HOST = import.meta.env.VITE_AUTH0_CALLBACK_HOST ?? "";

export function callback(path: string) {
	return isDevelopment
		? `http://localhost:1420/${path}`
		: `${CALLBACK_HOST ?? window.location.origin}/${path}`;
}
