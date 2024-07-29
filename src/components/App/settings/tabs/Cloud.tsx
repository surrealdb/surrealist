import { ActionIcon, Select, TextInput } from "@mantine/core";
import { SettingsSection } from "../utilities";
import { useSetting } from "~/hooks/config";
import { DatabaseListMode, Selection } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { CLOUD_API_BASE, CLOUD_API_MGMT_BASE, CLOUD_AUTH_BASE } from "~/util/defaults";
import { Icon } from "~/components/Icon";
import { iconReset } from "~/util/icons";

const CAT = "cloud";

const INSTANCE_LIST_MODES: Selection<DatabaseListMode> = [
	{ label: "List", value: "list" },
	{ label: "Grid", value: "grid" },
];

export function CloudTab() {
	const [instanceListMode, setInstanceListMode] = useSetting(CAT, "databaseListMode");
	const [urlAuthBase, setUrlAuthBase] = useSetting(CAT, "urlAuthBase");
	const [urlApiAuthBase, setUrlApiAuthBase] = useSetting(CAT, "urlApiBase");
	const [urlApiMgmtBase, setUrlApiMgmtBase] = useSetting(CAT, "urlApiMgmtBase");

	const [{ cloud_endpoints }] = useFeatureFlags();

	return (
		<>
			<SettingsSection>

				<Select
					label="Instance list mode"
					data={INSTANCE_LIST_MODES}
					value={instanceListMode}
					spellCheck={false}
					onChange={setInstanceListMode as any}
				/>

			</SettingsSection>

			{cloud_endpoints && (
				<SettingsSection label="Endpoints">

					<TextInput
						w="100%"
						label="Authentication Base URL"
						value={urlAuthBase}
						spellCheck={false}
						onChange={e => setUrlAuthBase(e.target.value)}
						rightSection={
							<ActionIcon
								onClick={() => setUrlAuthBase(CLOUD_AUTH_BASE)}
							>
								<Icon path={iconReset} />
							</ActionIcon>
						}
					/>

					<TextInput
						w="100%"
						label="API Base URL"
						value={urlApiAuthBase}
						spellCheck={false}
						onChange={e => setUrlApiAuthBase(e.target.value)}
						rightSection={
							<ActionIcon
								onClick={() => setUrlApiAuthBase(CLOUD_API_BASE)}
							>
								<Icon path={iconReset} />
							</ActionIcon>
						}
					/>

					<TextInput
						w="100%"
						label="Management API Base URL"
						value={urlApiMgmtBase}
						spellCheck={false}
						onChange={e => setUrlApiMgmtBase(e.target.value)}
						rightSection={
							<ActionIcon
								onClick={() => setUrlApiMgmtBase(CLOUD_API_MGMT_BASE)}
							>
								<Icon path={iconReset} />
							</ActionIcon>
						}
					/>

				</SettingsSection>
			)}
		</>
	);
}
