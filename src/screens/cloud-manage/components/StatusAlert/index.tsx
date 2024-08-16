import { Alert } from "@mantine/core";
import { mdiCloseCircleOutline } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { AlertLevel, CloudAlert } from "~/types";
import { iconHelp, iconWarning } from "~/util/icons";

type LevelInfoMap = Record<AlertLevel, [string, string, string, string]>;

const INFO_MAP = {
	info: [iconHelp, "blue.3", "blue.5",  "Info"],
	warning: [iconWarning, "orange.4", "orange.6", "Warning"],
	important: [mdiCloseCircleOutline, "red.5", "red.6", "Important"],
} satisfies LevelInfoMap;

export interface StatusAlertProps {
	alert: CloudAlert;
}

export function StatusAlert({
	alert,
}: StatusAlertProps) {
	const isLight = useIsLight();
	const [icon, colorDark, colorLight, title] = INFO_MAP[alert.message_type];

	return (
		<Alert
			color={isLight ? colorLight : colorDark}
			title={title}
			icon={<Icon path={icon} />}
			mb="xs"
		>
			{alert.message}
		</Alert>
	);
}