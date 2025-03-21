import { Box } from "@mantine/core";
import { useEffect } from "react";
import { CloudSplash } from "~/components/CloudSplash";
import { TopGlow } from "~/components/TopGlow";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";

export function CloudPage() {
	const authState = useCloudStore((s) => s.authState);
	const [, navigate] = useAbsoluteLocation();

	useEffect(() => {
		if (authState === "authenticated") {
			navigate("/overview");
		}
	}, [authState]);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

			<CloudSplash />
		</Box>
	);
}
