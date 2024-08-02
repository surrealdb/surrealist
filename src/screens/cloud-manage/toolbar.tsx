import { Icon } from "~/components/Icon";
import { useConfigStore } from "~/stores/config";
import { iconChevronRight } from "~/util/icons";
import { Spacer } from "~/components/Spacer";
import { ActionBar } from "~/components/ActionBar";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { CLOUD_PAGES } from "~/constants";

export function CloudToolbar() {
	const activePage = useConfigStore((s) => s.activeCloudPage);
	const pageName = CLOUD_PAGES[activePage]?.name ?? "Unknown";

	return (
		<>
			<PrimaryTitle ml={3}>
				Surreal Cloud
			</PrimaryTitle>
			<Icon
				path={iconChevronRight}
				size="xl"
				color="slate.5"
				mx={-8}
			/>
			<PrimaryTitle>
				{pageName}
			</PrimaryTitle>
			<Spacer />
			<ActionBar />
		</>
	);
}