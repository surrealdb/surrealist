import cloudUrl from "~/assets/images/icons/cloud.webp";
import classes from "../style.module.scss";

import { ActionIcon, Box, Dialog, Group, Image, Text } from "@mantine/core";
import type { MouseEvent } from "react";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { iconClose } from "~/util/icons";

export function CloudExpiredDialog() {
	const { setSessionExpired } = useCloudStore.getState();

	const isOpen = useCloudStore((s) => s.sessionExpired);

	const onClose = useStable((e?: MouseEvent) => {
		e?.stopPropagation();
		setSessionExpired(false);
	});

	return (
		<Dialog
			opened={isOpen}
			onClose={onClose}
			size={600}
			shadow="sm"
			radius="md"
			position={{
				left: "calc(50% - 263px)",
				right: "calc(50% + 300px)",
				bottom: 32,
			}}
			transitionProps={{
				transition: "slide-up",
				timingFunction: "ease",
				duration: 200,
			}}
			classNames={{
				root: classes.updateDialog,
			}}
			onClick={openCloudAuthentication}
		>
			<Group>
				<Image
					src={cloudUrl}
					alt="Surreal Cloud"
					w={48}
				/>
				<Box flex="1">
					<Text
						fw={600}
						c="bright"
					>
						Your session has expired
					</Text>
					<Text mt={2}>Please click here to sign in again and renew your session.</Text>
				</Box>
				<ActionIcon
					size="lg"
					onClick={onClose}
				>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>
		</Dialog>
	);
}
