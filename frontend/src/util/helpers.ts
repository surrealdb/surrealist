import { WindowSetTitle } from "../../wailsjs/runtime/runtime";

export function renameWindow(name?: string) {
	if (name) {
		WindowSetTitle(`Surrealist - ${name}`);
	} else {
		WindowSetTitle(`Surrealist`);
	}
}