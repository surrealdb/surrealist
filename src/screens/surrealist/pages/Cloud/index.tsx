import cloudImg from "~/assets/images/cloud-icon.webp";
import classes from "./style.module.scss";

import { Box, Button, Center, Group, Image, ScrollArea, Stack, Text } from "@mantine/core";

import { useEffect } from "react";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import { iconChevronRight, iconOpen } from "~/util/icons";

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

			{authState === "authenticated" ? (
				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					className={classes.scrollArea}
					viewportProps={{
						style: { paddingBlock: 75 },
					}}
				>
					<Stack
						w="100%"
						maw={1100}
						mx="auto"
						gap={38}
						pos="relative"
					>
						<Box>
							<PrimaryTitle fz={26}>Referral Program</PrimaryTitle>
							<Text fz="xl">
								Earn rewards for referring your friends and contacts
							</Text>
						</Box>
						TEST
					</Stack>
				</ScrollArea>
			) : (
				<Center h="90%">
					<Stack align="center">
						<Image
							src={cloudImg}
							alt="Sidekick"
							w={142}
						/>
						<PrimaryTitle
							fz={42}
							mt="xl"
						>
							Welcome to Surreal Cloud
						</PrimaryTitle>
						<Text
							fz="lg"
							maw={500}
						>
							Surreal Cloud redefines the database experience, offering the power and
							flexibility of SurrealDB without the pain of managing infrastructure.
						</Text>
						<Group
							mt="xl"
							w="100%"
							maw={400}
						>
							<Button
								flex={1}
								variant="gradient"
								onClick={openCloudAuthentication}
								rightSection={<Icon path={iconChevronRight} />}
								loading={authState === "loading"}
							>
								Sign in
							</Button>
							<Button
								flex={1}
								color="slate"
								variant="light"
								rightSection={<Icon path={iconOpen} />}
								onClick={() => adapter.openUrl("https://surrealdb.com/cloud")}
							>
								Learn more
							</Button>
						</Group>
					</Stack>
				</Center>
			)}
		</Box>
	);
}
