import { Box, type BoxProps, Button, Group, Image, Modal, Paper, Stack, Text } from "@mantine/core";
import { Icon, iconChevronRight, iconClose, pictoSurrealistGradient } from "@surrealdb/ui";
import glow from "~/assets/images/radial-glow.png";
import { ActionButton } from "~/components/ActionButton";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { StudioMigration } from "~/components/StudioMigration";
import { useBoolean } from "~/hooks/boolean";
import classes from "../style.module.scss";

/**
 * A permanent call to action informing users that Surrealist has been succeeded
 * by SurrealDB Studio, and offering them a way to migrate across.
 */
export function StudioCallToAction(props: BoxProps) {
	const [isOpen, openHandle] = useBoolean();

	return (
		<>
			<Paper
				p="xl"
				pos="relative"
				className={classes.studioCta}
				{...props}
			>
				<Group
					wrap="nowrap"
					align="flex-start"
					gap="xl"
					pos="relative"
					style={{ zIndex: 1 }}
				>
					<Image
						src={pictoSurrealistGradient}
						alt=""
						w={48}
						h={48}
						visibleFrom="sm"
					/>
					<Stack
						flex={1}
						gap="xs"
					>
						<PrimaryTitle fz={22}>Surrealist is now SurrealDB Studio</PrimaryTitle>
						<Text
							maw={560}
							className="selectable"
						>
							Surrealist has moved to a new home. SurrealDB Studio is the successor,
							and is where all future development takes place. Bring your connections
							and preferences along whenever you are ready.
						</Text>
						<Box mt="sm">
							<Button
								variant="gradient"
								onClick={openHandle.open}
								rightSection={<Icon path={iconChevronRight} />}
							>
								Move to SurrealDB Studio
							</Button>
						</Box>
					</Stack>
				</Group>
				<Image
					src={glow}
					alt=""
					className={classes.studioGlow}
				/>
			</Paper>

			<Modal
				opened={isOpen}
				onClose={openHandle.close}
				size={560}
			>
				<ActionButton
					pos="absolute"
					top={16}
					right={16}
					label="Close"
					onClick={openHandle.close}
					style={{ zIndex: 1 }}
				>
					<Icon path={iconClose} />
				</ActionButton>

				<StudioMigration
					compact
					mx="auto"
					pb="md"
				/>
			</Modal>
		</>
	);
}
