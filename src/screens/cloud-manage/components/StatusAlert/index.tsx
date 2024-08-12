import { Alert } from "@mantine/core";
import { mdiCloseCircleOutline } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { iconHelp, iconWarning } from "~/util/icons";

export type AlertLevel = "info" | "warning" | "important";

export interface Alert {
	level: AlertLevel;
	message: string;
	dismissable: boolean;
}

const INFO_MAP = {
	none: [null, "", ""],
	info: [iconHelp, "blue.3", "blue.5",  "Info"],
	warning: [iconWarning, "orange.4", "orange.6", "Warning"],
	important: [mdiCloseCircleOutline, "red.5", "red.6", "Important"],
};

export interface StatusAlertProps {
	alert: Alert | null;
	onDismiss?: () => void;
}

export function StatusAlert({
	alert,
	onDismiss,
}: StatusAlertProps) {
	const isLight = useIsLight();

	if (!alert) {
		return null;
	}

	const [icon, colorDark, colorLight, title] = INFO_MAP[alert.level];

	return (
		<Alert
			color={isLight ? colorLight : colorDark}
			title={title}
			icon={<Icon path={icon} />}
			withCloseButton={alert.dismissable}
			onClose={onDismiss}
			mb="xs"
		>
			{alert.message}
		</Alert>
	);
}