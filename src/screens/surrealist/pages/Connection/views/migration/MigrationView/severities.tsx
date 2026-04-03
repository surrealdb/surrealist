import { iconErrorCircle, iconHelp, iconWarning } from "@surrealdb/ui";
import { MigrationSeverity } from "~/types";

export const severityMeta: Record<
	MigrationSeverity,
	{
		color: string;
		label: string;
		icon: string;
		description: string;
	}
> = {
	unlikely_break: {
		color: "blue",
		label: "Note",
		icon: iconHelp,
		description: "A change unlikely to break the database. Review before upgrading.",
	},
	can_break: {
		color: "orange",
		label: "Potential issue",
		icon: iconWarning,
		description: "Changes might cause runtime issues. Review before upgrading.",
	},
	will_break: {
		color: "red",
		label: "Breaking issue",
		icon: iconErrorCircle,
		description: "The upgrade will fail unless this issue is resolved.",
	},
};
