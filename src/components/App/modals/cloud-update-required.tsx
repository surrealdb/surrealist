import { ActionIcon, Box, Dialog, Group, Image, Text } from "@mantine/core";
import { type MouseEvent, useMemo } from "react";
import { isDesktop } from "~/adapter";
import cloudUrl from "~/assets/images/icons/cloud.webp";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useDesktopUpdater } from "~/hooks/updater";
import { useCloudStore } from "~/stores/cloud";
import { useInterfaceStore } from "~/stores/interface";
import { iconClose } from "~/util/icons";
import classes from "../style.module.scss";

export function CloudUpdateRequiredDialog() {
	const { setIsSupported } = useCloudStore.getState();

	const isOpen = useCloudStore((s) => !s.isSupported);
	const update = useInterfaceStore((s) => s.availableUpdate);

	const noUpdate = useMemo(() => {
		return !isDesktop || !update || !update.available;
	}, [update]);

	const { phase, progress, version, startUpdate } = useDesktopUpdater();

	const onClose = useStable((e?: MouseEvent) => {
		e?.stopPropagation();
		setIsSupported(true);
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
			style={{
				cursor: noUpdate ? "not-allowed" : "pointer",
			}}
			onClick={noUpdate ? undefined : startUpdate}
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
						Surrealist update required for Surreal Cloud
					</Text>
					<Text mt={4}>
						{noUpdate ? (
							<Text c="red">
								No update available. Please contact{" "}
								<a href="mailto:support@surrealdb.com">support@surrealdb.com</a> for
								assistance
							</Text>
						) : phase === "downloading" ? (
							<Text c="gray.5">Installing... ({progress}%)</Text>
						) : phase === "error" ? (
							<Text c="red">Failed to install update</Text>
						) : (
							<Text c="gray.5">Click to install version {version}</Text>
						)}
					</Text>
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
