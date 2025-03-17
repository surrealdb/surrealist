import { Alert, MantineColor } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { BannerType, CloudBanner } from "~/types";
import { iconBullhorn, iconWarning } from "~/util/icons";

const BANNER_INFO: Record<BannerType, [MantineColor, string, string]> = {
	info: ["blue", "Service Update", iconBullhorn],
	warning: ["orange", "Service Update", iconWarning],
	important: ["red", "Important Service Update", iconWarning],
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
