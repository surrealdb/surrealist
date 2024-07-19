import classes from "./style.module.scss";
import logoImg from "~/assets/images/cloud-logo.svg";
import splashImg from "~/assets/images/cloud-splash.webp";
import { FC } from "react";
import { useConfigStore } from "~/stores/config";
import { CloudPage } from "~/types";
import { InstancesPage } from "./pages/Instances";
import { MembersPage } from "./pages/Members";
import { useCloudStore } from "~/stores/cloud";
import { iconOpen } from "~/util/icons";
import { Box, Button, Group, Image, Stack, Text } from "@mantine/core";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { openCloudAuthentication } from "./auth";
import { mdiAccountOutline } from "@mdi/js";
import { CloudToolbar } from "./toolbar";

const PAGE_VIEWS: Record<CloudPage, FC> = {
	// overview: OverviewPage,
	instances: InstancesPage,
	members: MembersPage
};

export function CloudContent() {
	const page = useConfigStore(s => s.activeCloudPage);
	const state = useCloudStore(s => s.authState);
	const Content = PAGE_VIEWS[page];

	return state === "authenticated" ? (
		<>
			<Group
				gap="md"
				pos="relative"
				align="center"
				wrap="nowrap"
			>
				<CloudToolbar />
			</Group>
			{Content && <Content />}
		</>
	) : (
		<>
			<Stack
				gap={38}
				flex={1}
				align="center"
				justify="center"
				style={{ zIndex: 1 }}
				pb={175}
			>
				<Image
					src={logoImg}
					alt="Surreal Cloud"
					w={500}
				/>
				<Text w={500} fz="lg" ta="center">
					Surreal Cloud redefines the database experience, offering the power and flexibility of SurrealDB without the pain of managing infrastructure. Elevate your business to unparalleled levels of scale and resilience. Focus on building tomorrow's applications. Let us take care of the rest.
				</Text>
				<Group>
					<Button
						w={164}
						color="slate"
						variant={state === "loading" ? "filled" : "gradient"}
						leftSection={<Icon path={mdiAccountOutline} />}
						onClick={openCloudAuthentication}
						loading={state === "loading"}
					>
						Sign in
					</Button>
					<Button
						w={164}
						color="slate"
						rightSection={<Icon path={iconOpen} />}
						onClick={() => adapter.openUrl("https://surrealdb.com/cloud")}
					>
						Learn more
					</Button>
				</Group>
			</Stack>
			<Box
				pos="absolute"
				bottom={-15}
				left={0}
				right={0}
				h={333}
				display="flex"
				style={{
					alignItems: "center",
					justifyContent: "center",
					overflow: "hidden"
				}}
			>
				<Image
					src={splashImg}
					alt="Surreal Cloud"
					h="100%"
					className={classes.splashImage}
				/>
			</Box>
		</>
	);
}