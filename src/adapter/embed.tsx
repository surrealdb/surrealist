import { SANDBOX } from "~/constants";
import { BrowserAdapter } from "./browser";

export class EmbedAdapter extends BrowserAdapter {

	public async loadConfig() {
		return `{"activeConnection":"${SANDBOX}"}`;
	}

	public async saveConfig(config: string) {
		// noop
	}

}