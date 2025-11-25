import { MigrationDiagnosticResult } from "~/types";
import { iconBug, iconErrorCircle, iconWarning } from "~/util/icons";

export const severityMeta: Record<
	MigrationDiagnosticResult["severity"],
	{
		color: string;
		label: string;
		icon: string;
		description: string;
	}
> = {
	might_break: {
		color: "yellow",
		label: "Might break",
		icon: iconWarning,
		description: "Changes might cause runtime issues. Review before upgrading.",
	},
	will_break: {
		color: "red",
		label: "Will break",
		icon: iconErrorCircle,
		description: "The upgrade will fail unless this issue is resolved.",
	},
	breaking_resolution: {
		color: "violet",
		label: "Needs resolution",
		icon: iconBug,
		description: "The migration can only continue after resolving this issue.",
	},
};
