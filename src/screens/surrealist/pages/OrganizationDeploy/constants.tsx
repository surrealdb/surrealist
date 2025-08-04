import { iconHistory, iconNamespace, iconRelation, iconUpload } from "~/util/icons";
import { StartingData } from "./types";

export const STARTING_DATA: StartingData[] = [
	{
		id: "none",
		title: "Empty",
		description: "Start fresh with an entirely empty instance.",
		icon: iconNamespace,
	},
	{
		id: "dataset",
		title: "Demo dataset",
		description: "Explore Surreal Cloud with one of our demo datasets.",
		icon: iconRelation,
	},
	{
		id: "upload",
		title: "Upload from file",
		description: "Get started by uploading a surql file from your local device.",
		icon: iconUpload,
	},
	{
		id: "restore",
		title: "Restore from backup",
		description: "Restore from a backup of an existing Surreal Cloud instance.",
		icon: iconHistory,
	},
];
