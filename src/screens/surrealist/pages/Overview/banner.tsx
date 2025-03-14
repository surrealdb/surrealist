import { Alert, MantineColor } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { BannerType, CloudBanner } from "~/types";
import { iconHelp, iconWarning } from "~/util/icons";

const BANNER_INFO: Record<BannerType, [MantineColor, string, string]> = {
	info: ["blue", "Notice", iconHelp],
	warning: ["orange", "Warning", iconWarning],
	important: ["red", "Important", iconWarning],
};

export interface CloudAlertProps {
	banner: CloudBanner;
}

export function CloudAlert({ banner }: CloudAlertProps) {
	const [color, title, icon] = BANNER_INFO[banner.message_type];

	return (
		<Alert
			mt="xl"
			color={color}
			title={title}
			icon={<Icon path={icon} />}
		>
			{banner.message}
		</Alert>
	);
}
