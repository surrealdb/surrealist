import { SettingsSection } from "../utilities";
import { useSetting } from "~/hooks/config";

const CAT = "templates";

export function TemplatesTab() {
	const [list, setList] = useSetting(CAT, "list");

	return (
		<>
			<SettingsSection>

				TODO

			</SettingsSection>
		</>
	);
}
