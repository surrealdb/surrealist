import { openDB } from "idb";
import { CONFIG_KEY } from "./storage";

const DATABASE = "surrealist";
const VERSION = 1;
const STORE = "store";

const request = openDB(DATABASE, VERSION, {
	upgrade(db) {
		db.createObjectStore(STORE);
	},
});

/**
 * Retrieve the browser stored configuration
 */
async function getConfig() {
	return (await request).get(STORE, CONFIG_KEY);
}
/**
 * Save the configuration to the browser storage
 */
async function setConfig(value: any) {
	return (await request).put(STORE, value, CONFIG_KEY);
}

export { getConfig, setConfig };
