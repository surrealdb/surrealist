import classes from "./style.module.scss";

import {
	ActionIcon,
	Avatar,
	Badge,
	type BoxProps,
	Divider,
	Group,
	Modal,
	Paper,
	Popover,
	Skeleton,
	Stack,
	Tooltip,
} from "@mantine/core";

import { Text } from "@mantine/core";
import { Fragment, useMemo } from "react";
import { useRoute } from "wouter";
import { ActionButton } from "~/components/ActionButton";
import { BetaBadge } from "~/components/BetaBadge";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { CLOUD_PAGES } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useActiveCloudPage } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import type { CloudPage, CloudPageInfo } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { iconCheck, iconChevronDown, iconViewGrid } from "~/util/icons";

const NAVIGATION: CloudPage[][] = [
	[
		"instances",
		"billing",
		// "data",
	],
	[
		// "members",
		// "audits",
	],
	["chat", "support"],
	["settings"],
];

export function CloudSidebar(props: BoxProps) {
	const { setActiveCloudOrg } = useConfigStore.getState();
	const [flags] = useFeatureFlags();

	const [showNavModal, navModalHandle] = useBoolean();

	const state = useCloudStore((s) => s.authState);
	const activeOrg = useConfigStore((s) => s.activeCloudOrg);
	const organizations = useCloudStore((s) => s.organizations);

	const [activePage, setActiveCloudPage] = useActiveCloudPage();

	const navigation = useMemo(() => {
		return NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = CLOUD_PAGES[id];

				return !info || !info.disabled?.(flags) !== true ? [] : [info];
			});

			return items.length > 0 ? [items] : [];
		});
	}, [flags]);

	const isLoading = state === "loading";

	function renderNavigation(info: CloudPageInfo) {
		return (
			<Skeleton visible={isLoading}>
				<Entry
					key={info.id}
					isActive={activePage === info}
					leftSection={<Icon path={info.icon} />}
					rightSection={info.id === "chat" ? <BetaBadge /> : undefined}
					onClick={() => {
						setActiveCloudPage(info.id);
						navModalHandle.close();
					}}
				>
					{info.name}
				</Entry>
			</Skeleton>
		);
	}

	const orgName = organizations.find((org) => org.id === activeOrg)?.name || "Unknown";

	return (
		<Stack
			className={classes.cloudSidebar}
			{...props}
		>
			<Group wrap="nowrap">
				<ActionButton
					size={38}
					hiddenFrom="sm"
					variant="gradient"
					label="Manage organization"
					className={classes.openNavigation}
					onClick={navModalHandle.open}
				>
					<Icon
						path={iconViewGrid}
						size="lg"
					/>
				</ActionButton>
				<Popover
					width="target"
					position="bottom-start"
					transitionProps={{
						transition: "scale-y",
					}}
				>
					<Popover.Target>
						<Skeleton visible={isLoading}>
							<Paper
								withBorder
								p="xs"
							>
								<Group
									style={{
										cursor: "pointer",
									}}
								>
									<Avatar
										name={orgName}
										radius="xs"
										size="sm"
									/>
									<Text
										c="bright"
										fw={600}
									>
										{orgName}
									</Text>
									<Spacer />
									<Icon path={iconChevronDown} />
								</Group>
							</Paper>
						</Skeleton>
					</Popover.Target>
					<Popover.Dropdown p="xs">
						{organizations.map((org) => (
							<Entry
								key={org.id}
								rightSection={
									org.id === activeOrg ? <Icon path={iconCheck} /> : undefined
								}
								onClick={() => setActiveCloudOrg(org.id)}
								p="sm"
							>
								{org.name}
							</Entry>
						))}
						<Divider />
						<Text p="sm">
							The ability to create organizations is not currently available.
						</Text>
					</Popover.Dropdown>
				</Popover>
			</Group>

			<Stack
				gap="sm"
				flex={1}
				visibleFrom="sm"
			>
				{navigation.map((items, i) => (
					<Fragment key={i}>
						{items.map((info) => (
							<Fragment key={info.id}>{renderNavigation(info)}</Fragment>
						))}
						{i < navigation.length - 1 && <Divider />}
					</Fragment>
				))}
			</Stack>

			<Modal
				opened={showNavModal}
				onClose={navModalHandle.close}
				withCloseButton
				title={<PrimaryTitle>Manage organization</PrimaryTitle>}
			>
				<Stack gap="sm">
					{navigation.map((items, i) => (
						<Fragment key={i}>
							{items.map((info) => (
								<Fragment key={info.id}>{renderNavigation(info)}</Fragment>
							))}
							{i < navigation.length - 1 && <Divider />}
						</Fragment>
					))}
				</Stack>
			</Modal>
		</Stack>
	);
}
