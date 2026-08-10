import { Box, type BoxProps, Button, Group, Image, Paper, Stack, Text } from "@mantine/core";
import { Icon, iconChevronRight } from "@surrealdb/ui";
import { adapter } from "~/adapter";
import glow from "~/assets/images/radial-glow.png";
import studioAppIcon from "~/assets/images/studio.png";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import classes from "../style.module.scss";

/**
 * A permanent call to action informing users that Surrealist has been succeeded
 * by SurrealDB Studio, and offering them a way to migrate across.
 */
export function StudioCallToAction(props: BoxProps) {
	return (
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
					src={studioAppIcon}
					alt=""
					w={52}
					h={52}
					visibleFrom="sm"
				/>
				<Stack
					flex={1}
					gap="xs"
				>
					<PrimaryTitle fz={20}>Surrealist is now SurrealDB Studio</PrimaryTitle>
					<Text
						fz="lg"
						maw={750}
						className="selectable"
						style={{ textWrap: "pretty" }}
					>
						Introducing SurrealDB Studio, the successor to Surrealist, and the most
						powerful way to interact with your data yet. Benefit from improved
						performance, an easier navigation experience, and new ways to present your
						data.
					</Text>
					<Box mt="sm">
						<Button
							variant="gradient"
							rightSection={<Icon path={iconChevronRight} />}
							onClick={() => adapter.openUrl("https://surrealdb.com/studio?download")}
						>
							Download SurrealDB Studio
						</Button>
					</Box>
				</Stack>
			</Group>
			<Image
				src={glow}
				alt=""
				className={classes.studioGlow1}
			/>
			<Image
				src={glow}
				alt=""
				className={classes.studioGlow2}
			/>
		</Paper>
	);
}
