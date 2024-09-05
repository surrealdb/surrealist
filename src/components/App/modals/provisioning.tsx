import { useEffect } from "react";
import classes from "../style.module.scss";
import { Center, Dialog, Group, Loader, Stack, Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { iconCheck, iconSurreal } from "~/util/icons";
import { fetchAPI } from "~/screens/cloud-manage/api";
import { CloudInstance } from "~/types";
import { sleep } from "radash";
import { Icon } from "~/components/Icon";

export function ProvisioningDialog() {
	const { finishProvisioning, hideProvisioning } = useCloudStore.getState();
	const isLight = useIsLight();

	const isProvisioning = useCloudStore((s) => s.isProvisioning);
	const isProvisionDone = useCloudStore((s) => s.isProvisionDone);
	const provisioning = useCloudStore((s) => s.provisioning);

	useEffect(() => {
		if (isProvisioning && provisioning && !isProvisionDone) {
			const task = setInterval(async () => {
				try {
					const instance = await fetchAPI<CloudInstance>(`/instances/${provisioning.id}`);

					if (instance.state === "ready") {
						finishProvisioning();

						await sleep(1000);

						hideProvisioning();
					}
				} catch {
					// Ignore and continue
				}
			}, 1500);

			return () => {
				clearInterval(task);
			};
		}
	}, [isProvisionDone, isProvisioning, provisioning, hideProvisioning, finishProvisioning]);

	return (
		<Dialog
			opened={isProvisioning}
			size="lg"
			shadow="sm"
			className={classes.provisionDialog}
			position={{
				bottom: "var(--mantine-spacing-xl)",
				right: "var(--mantine-spacing-xl)"
			}}
			transitionProps={{
				transition: "slide-up",
				timingFunction: "ease",
				duration: 200
			}}
		>
			<Group wrap="nowrap">
				{isProvisionDone ? (
					<Center
						w={48}
						h={48}
						mx={4}
						style={{
							borderRadius: "50%",
							backgroundOrigin: "border-box",
							border: `1px solid rgba(255, 255, 255, 0.3)`,
							backgroundImage: `linear-gradient(var(--mantine-color-lime-6), var(--mantine-color-green-7))`,
							boxShadow: '0 3px 12px rgba(130, 201, 30, 0.5)'
						}}
					>
						<Icon path={iconCheck} c="white" size="xl" />
					</Center>
				) : (
					<Center
						className={classes.provisionBox}
						pos="relative"
						mx={4}
						w={48}
						h={48}
					>
						<Loader
							className={classes.provisionLoader}
							inset={0}
							size="100%"
							pos="absolute"
						/>
						<svg
							viewBox="0 0 24 24"
							className={classes.provisionIcon}
						>
							<path
								d={iconSurreal}
								fill={isLight ? "black" : "white"}
							/>
						</svg>
					</Center>
				)}
				<Stack gap={2}>
					<Text
						fw={500}
						c="bright"
						fz="lg"
					>
						{isProvisionDone ? "Instance successfully provisioned" :  "We are provisioning your instance"}
					</Text>
					{provisioning && (
						<Text>
							{provisioning.name}
						</Text>
					)}
				</Stack>
			</Group>
		</Dialog>
	);
}