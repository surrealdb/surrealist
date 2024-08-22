import cloudLogo from "~/assets/images/cloud-icon.svg";
import classes from "../style.module.scss";
import { ActionIcon, Box, Dialog, Group, Image, Text } from "@mantine/core";
import { useCloudStore } from "~/stores/cloud";
import { Icon } from "~/components/Icon";
import { iconClose } from "~/util/icons";
import { useStable } from "~/hooks/stable";
import { MouseEvent } from "react";
import { openCloudAuthentication } from "~/screens/cloud-manage/api/auth";

export function CloudExpiredDialog() {
	const { setSessionExpired } = useCloudStore.getState();

	const isOpen = useCloudStore(s => s.sessionExpired);

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
				left: "calc(50% - 300px)",
				right: "calc(50% + 300px)",
				bottom: 32
			}}
			transitionProps={{
				transition: "slide-up",
				timingFunction: "ease",
				duration: 200
			}}
			classNames={{
				root: classes.updateDialog
			}}
			onClick={openCloudAuthentication}
		>
			<Group>
				<Image
					src={cloudLogo}
					alt="Surreal Cloud"
					w={48}
				/>
				<Box flex="1">
					<Text fw={600} c="bright">
						Your Surreal Cloud session has expired
					</Text>
					<Text mt={4}>
						Click here to authenticate again
					</Text>
				</Box>
				<ActionIcon
					size="lg"
					onClick={onClose}
				>
					<Icon
						path={iconClose}
					/>
				</ActionIcon>
			</Group>
		</Dialog>
	);
}