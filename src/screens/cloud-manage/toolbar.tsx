import { ActionBar } from "~/components/ActionBar";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { CLOUD_PAGES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { iconChevronRight } from "~/util/icons";

export function CloudToolbar() {
	const activePage = useConfigStore((s) => s.activeCloudPage);
	const pageName = CLOUD_PAGES[activePage]?.name ?? "Unknown";

	return (
		<>
			<PrimaryTitle ml={3}>Surreal Cloud</PrimaryTitle>
			<Icon path={iconChevronRight} size="xl" color="slate.5" mx={-8} />
			<PrimaryTitle>{pageName}</PrimaryTitle>
			<Spacer />
			<ActionBar />
		</>
	);
}
