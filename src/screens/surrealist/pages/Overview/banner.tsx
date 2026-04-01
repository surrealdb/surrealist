import { Alert, MantineColor } from "@mantine/core";
import { Icon, iconBullhorn, iconWarning } from "@surrealdb/ui";
import { useConfigStore } from "~/stores/config";
import { BannerType, CloudBanner } from "~/types";

const BANNER_INFO: Record<BannerType, [MantineColor, string, string]> = {
	info: ["violet", "Service Update", iconBullhorn],
	warning: ["orange", "Service Update", iconWarning],
	important: ["red", "Important Service Update", iconWarning],
};

export interface CloudAlertProps {
	banner: CloudBanner;
}

export function CloudAlert({ banner }: CloudAlertProps) {
	const [color, title, icon] = BANNER_INFO[banner.message_type];
	const dismissBanner = useConfigStore((s) => s.dismissBanner);

	return (
		<Alert
			mt="xl"
			color={color}
			title={title}
			icon={<Icon path={icon} />}
			withCloseButton
			onClose={() => dismissBanner(banner.timestamp)}
		>
			{banner.message}
		</Alert>
	);
}
