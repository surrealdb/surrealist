import { openDB } from "idb";
import { CONFIG_KEY } from "./storage";

const dbName = "surrealist";
const indexedDbVersion = 1;
const keyValueStore = "store";

const dbPromise = openDB(dbName, indexedDbVersion, {
	upgrade(db) {
		db.createObjectStore(keyValueStore);
	},
});

async function getConfig() {
	return (await dbPromise).get(keyValueStore, CONFIG_KEY);
}
async function setConfig(value: any) {
	return (await dbPromise).put(keyValueStore, value, CONFIG_KEY);
}

export { getConfig, setConfig };
