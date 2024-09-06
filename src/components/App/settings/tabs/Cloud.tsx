import { Select, TextInput } from "@mantine/core";
import { useSetting } from "~/hooks/config";
import type { DatabaseListMode, Selection } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { SettingsSection } from "../utilities";

const CAT = "cloud";

const INSTANCE_LIST_MODES: Selection<DatabaseListMode> = [
	{ label: "List", value: "list" },
	{ label: "Grid", value: "grid" },
];

export function CloudTab() {
	const [instanceListMode, setInstanceListMode] = useSetting(
		CAT,
		"databaseListMode",
	);
	const [urlAuthBase, setUrlAuthBase] = useSetting(CAT, "urlAuthBase");
	const [urlApiAuthBase, setUrlApiAuthBase] = useSetting(CAT, "urlApiBase");
	const [urlApiMgmtBase, setUrlApiMgmtBase] = useSetting(
		CAT,
		"urlApiMgmtBase",
	);

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

			{cloud_endpoints === "custom" && (
				<SettingsSection label="Custom endpoints">
					<TextInput
						w="100%"
						label="Authentication Base URL"
						value={urlAuthBase}
						spellCheck={false}
						onChange={(e) => setUrlAuthBase(e.target.value)}
					/>

					<TextInput
						w="100%"
						label="API Base URL"
						value={urlApiAuthBase}
						spellCheck={false}
						onChange={(e) => setUrlApiAuthBase(e.target.value)}
					/>

					<TextInput
						w="100%"
						label="Management API Base URL"
						value={urlApiMgmtBase}
						spellCheck={false}
						onChange={(e) => setUrlApiMgmtBase(e.target.value)}
					/>
				</SettingsSection>
			)}
		</>
	);
}
