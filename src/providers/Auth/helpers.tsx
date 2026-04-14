import { isDevelopment } from "~/util/environment";

export function callback(path: string) {
	return isDevelopment ? `http://localhost:1420/${path}` : `${window.location.origin}/${path}`;
}
