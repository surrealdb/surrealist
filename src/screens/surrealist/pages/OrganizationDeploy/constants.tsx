import { StartingData } from "~/types";
import { iconHistory, iconNamespace, iconRelation, iconUpload } from "~/util/icons";
import { StartingDataInfo } from "./types";

export const STARTING_DATA: Record<StartingData, StartingDataInfo> = {
	none: {
		id: "none",
		title: "Empty",
		description: "Start fresh with an entirely empty instance.",
		icon: iconNamespace,
	},
	dataset: {
		id: "dataset",
		title: "Demo dataset",
		description: "Explore SurrealDB Cloud with one of our demo datasets.",
		icon: iconRelation,
	},
	upload: {
		id: "upload",
		title: "Upload from file",
		description: "Get started by uploading a surql file from your local device.",
		icon: iconUpload,
	},
	restore: {
		id: "restore",
		title: "Restore from backup",
		description: "Restore from a backup of an existing SurrealDB Cloud instance.",
		icon: iconHistory,
	},
};
