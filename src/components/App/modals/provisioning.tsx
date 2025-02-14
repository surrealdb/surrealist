import classes from "../style.module.scss";

import { Center, Dialog, Group, Loader, Stack, Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { sleep } from "radash";
import { useEffect } from "react";
import { fetchAPI } from "~/cloud/api";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance } from "~/types";
import { iconCheck, iconSurreal } from "~/util/icons";

export function ProvisioningDialog() {
	const { finishProvisioning, hideProvisioning } = useCloudStore.getState();
	const client = useQueryClient();
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

						client.invalidateQueries({
							queryKey: ["cloud", "instances"],
						});

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
			onClose={hideProvisioning}
			size="lg"
			shadow="sm"
			withCloseButton
			position={{
				bottom: "var(--mantine-spacing-xl)",
				right: "var(--mantine-spacing-xl)",
			}}
			transitionProps={{
				transition: "slide-up",
				timingFunction: "ease",
				duration: 200,
			}}
		>
			<Group wrap="nowrap">
				{isProvisionDone ? (
					<Center
						w={48}
						h={48}
						mx={4}
						className={classes.provisionComplete}
					>
						<Icon
							path={iconCheck}
							c="white"
							size="xl"
						/>
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
							<title>Loading spinner</title>
							<path
								d={iconSurreal}
								fill={isLight ? "black" : "white"}
							/>
						</svg>
					</Center>
				)}
				<Stack gap={2}>
					<Text
						fw={600}
						c="bright"
						fz="lg"
					>
						{isProvisionDone
							? "Instance successfully provisioned"
							: "Your instance is being provisioned"}
					</Text>
					{provisioning && <Text>{provisioning.name}</Text>}
				</Stack>
			</Group>
		</Dialog>
	);
}
