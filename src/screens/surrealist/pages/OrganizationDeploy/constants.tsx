import { iconDatabase, iconHistory, iconSandbox, iconUpload } from "~/util/icons";
import { StartingData } from "./types";

export const STARTING_DATA: StartingData[] = [
	{
		id: "none",
		title: "None",
		description: "Start fresh with an entirely empty instance.",
		icon: iconSandbox,
	},
	{
		id: "dataset",
		title: "Demo Dataset",
		description: "Explore Surreal Cloud with one of our demo datasets.",
		icon: iconDatabase,
	},
	{
		id: "upload",
		title: "Upload",
		description: "Get started by uploading a .surql file from your local device.",
		icon: iconUpload,
	},
	{
		id: "restore",
		title: "Restore",
		description: "Restore from a backup of an existing Surreal Cloud instance.",
		icon: iconHistory,
	},
];
