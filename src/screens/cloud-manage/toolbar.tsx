import classes from "./style.module.scss";
import { Divider, Group, Menu, SegmentedControl, Text } from "@mantine/core";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { CLOUD_PAGES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { iconCheck, iconChevronDown, iconCog } from "~/util/icons";
import { useCloudStore } from "~/stores/cloud";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import { CloudPage } from "~/types";
import { ActionBar } from "~/components/ActionBar";
import { CloudSettings } from "./components/Settings";

export function CloudToolbar() {
	const { setActiveCloudPage, setActiveCloudOrg } = useConfigStore.getState();

	const activePage = useConfigStore((s) => s.activeCloudPage);
	const activeOrg = useConfigStore((s) => s.activeCloudOrg);
	const organizations = useCloudStore((s) => s.organizations);

	const [showSettings, settingsHandle] = useBoolean();

	const pages = useMemo(() => {
		return [
			...Object.values(CLOUD_PAGES).map(({ name, id, icon }) => ({
				value: id,
				label: (
					<Group wrap="nowrap" gap="sm">
						<Icon path={icon} ml={-4} />
						{name}
					</Group>
				)
			})),
			{
				value: "settings",
				label: (
					<Group wrap="nowrap" gap="sm">
						<Icon path={iconCog} ml={-4} />
						Settings
					</Group>
				)
			}
		];
	}, []);

	const openPage = useStable((value: string) => {
		if (value === "settings") {
			settingsHandle.open();
			return;
		}

		setActiveCloudPage(value as CloudPage);
	});

	const orgName = organizations.find((org) => org.id === activeOrg)?.name || "Unknown";

	return (
		<>
			<Menu
				position="bottom-start"
				offset={12}
			>
				<Menu.Target>
					<Group
						style={{
							cursor: "pointer"
						}}
					>
						<Text c="bright" fw={600}>
							{orgName}
						</Text>
						<Icon path={iconChevronDown} />
					</Group>
				</Menu.Target>
				<Menu.Dropdown w={225}>
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
					{/* <Menu.Item
						leftSection={<Icon path={iconPlus} />}
						p="sm"
					>
						Create organisation
					</Menu.Item> */}
					<Text p="sm" c="slate.2">
						The ability to create organizations is not available during the alpha.
					</Text>
				</Menu.Dropdown>
			</Menu>
			<Divider
				orientation="vertical"
				color="slate.7"
			/>
			<SegmentedControl
				data={pages}
				color="slate"
				radius="sm"
				className={classes.pageSwitcher}
				value={activePage}
				onChange={openPage}
			/>
			<Spacer />
			<ActionBar />

			<CloudSettings
				opened={showSettings}
				onClose={settingsHandle.close}
			/>

		</>
	);
}