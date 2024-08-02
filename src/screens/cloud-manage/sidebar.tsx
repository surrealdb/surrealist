import { Avatar, Divider, Group, Menu, Paper, Stack } from "@mantine/core";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { CLOUD_PAGES } from "~/constants";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { iconChevronDown, iconCheck } from "~/util/icons";
import { Text } from "@mantine/core";
import { Spacer } from "~/components/Spacer";
import { CloudPage } from "~/types";
import { Fragment, useMemo } from "react";
import { useFeatureFlags } from "~/util/feature-flags";

const NAVIGATION: CloudPage[][] = [
	[
		"instances",
		"data",
	],
	[
		"members",
		"audits",
	],
	[
		"billing",
		"support",
		"settings",
	],
];

export function CloudSidebar() {
	const { setActiveCloudPage, setActiveCloudOrg } = useConfigStore.getState();
	const [flags] = useFeatureFlags();

	const activePage = useConfigStore((s) => s.activeCloudPage);
	const activeOrg = useConfigStore((s) => s.activeCloudOrg);
	const organizations = useCloudStore((s) => s.organizations);

	const navigation = useMemo(() => {
		return NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = CLOUD_PAGES[id];

				return (!info || !info.disabled?.(flags) !== true) ? [] : [info];
			});

			return items.length > 0 ? [items] : [];
		});
	}, [flags]);

	const orgName = organizations.find((org) => org.id === activeOrg)?.name || "Unknown";

	return (
		<Paper
			w={250}
			bg="slate.8"
			p="md"
		>
			<Menu
				position="bottom-start"
				transitionProps={{
					transition: "scale-y"
				}}
			>
				<Menu.Target>
					<Paper
						withBorder
						p="xs"
					>
						<Group
							style={{
								cursor: "pointer"
							}}
						>
							<Avatar
								name={orgName}
								radius="xs"
								size="sm"
							/>
							<Text c="bright" fw={600}>
								{orgName}
							</Text>
							<Spacer />
							<Icon path={iconChevronDown} />
						</Group>
					</Paper>
				</Menu.Target>
				<Menu.Dropdown w={226}>
					{organizations.map((org) => (
						<Menu.Item
							key={org.id}
							rightSection={org.id === activeOrg ? <Icon path={iconCheck} /> : undefined}
							onClick={() => setActiveCloudOrg(org.id)}
							p="sm"
						>
							{org.name}
						</Menu.Item>
					))}
					<Menu.Divider />
					<Text p="sm" c="slate.2">
						The ability to create organizations is not available during the alpha.
					</Text>
				</Menu.Dropdown>
			</Menu>

			<Stack
				gap="sm"
				mt="xl"
			>
				{navigation.map((items, i) => (
					<Fragment key={i}>
						{items.map(info => (
							<Entry
								key={info.id}
								isActive={activePage === info.id}
								leftSection={<Icon path={info.icon} />}
								onClick={() => setActiveCloudPage(info.id)}
							>
								{info.name}
							</Entry>
						))}
						{i < navigation.length - 1 && (
							<Divider color="slate.6" />
						)}
					</Fragment>
				))}
			</Stack>
		</Paper>
	);
}
