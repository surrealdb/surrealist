import { Box, Button, Center, Modal, RingProgress, Stack, Text, ThemeIcon } from "@mantine/core";
import { Icon, iconDownload, SectionTitle } from "@surrealdb/ui";
import { useBoolean } from "~/hooks/boolean";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useDesktopUpdater } from "~/hooks/updater";
import { useInterfaceStore } from "~/stores/interface";
import classes from "../style.module.scss";

export function UpdateModal() {
	const [isOpen, openedHandle] = useBoolean();
	const availableUpdate = useInterfaceStore((s) => s.availableUpdate);

	const { phase, progress, version, startUpdate, dismissUpdate } = useDesktopUpdater();

	useIntent("open-update", () => {
		if (useInterfaceStore.getState().availableUpdate) {
			openedHandle.open();
		}
	});

	const installLater = useStable(() => {
		dismissUpdate();
		openedHandle.close();
	});

	const installNow = useStable(() => {
		startUpdate();
	});

	return (
		<Modal
			opened={isOpen && !!availableUpdate}
			onClose={openedHandle.close}
			size="sm"
			radius="md"
			padding={0}
			styles={{
				content: { borderRadius: "var(--paper-radius)", overflow: "hidden" },
			}}
		>
			<Box className={classes.updateHeader}>
				<Center
					pt="xl"
					pb="xlg"
				>
					<ThemeIcon
						color="var(--surreal-paper-background)"
						variant="filled"
						size={96}
						radius={100}
						mb={-80}
						style={{ zIndex: 2 }}
					>
						{phase === "downloading" ? (
							<RingProgress
								rootColor="var(--mantine-color-violet-light)"
								sections={[
									{ value: progress, color: "var(--mantine-color-violet-text)" },
								]}
								thickness={6}
								size={80}
								label={`${progress.toFixed(0)}%`}
								styles={{
									label: {
										textAlign: "center",
									},
								}}
							/>
						) : (
							<Icon
								path={iconDownload}
								size={52}
								c="bright"
							/>
						)}
					</ThemeIcon>
				</Center>
				<Box
					component="svg"
					viewBox="0 0 1440 125"
					preserveAspectRatio="none"
					display="block"
					style={{ zIndex: 1 }}
					pos="relative"
				>
					<path
						d="M 0 60 Q 350 120 720 120 T 1440 60 L 1440 250 L 0 250 Z"
						fill="var(--surreal-paper-background)"
					/>
				</Box>
			</Box>
			<Stack
				p="xl"
				ta="center"
				pt="3xl"
			>
				<SectionTitle order={2}>Update available</SectionTitle>
				<Text inherit>
					Updating ensures you have access to the latest features, the best performance,
					and important security or bug fixes.
				</Text>
				{phase === "error" && (
					<Text c="red">Failed to install the update automatically</Text>
				)}

				<Button
					mt="xl"
					variant="gradient"
					onClick={installNow}
					disabled={phase === "downloading"}
				>
					Install Surrealist {version}
				</Button>

				<Button
					variant="transparent"
					onClick={installLater}
					disabled={phase === "downloading"}
				>
					Skip this version
				</Button>
			</Stack>
		</Modal>
	);
}
