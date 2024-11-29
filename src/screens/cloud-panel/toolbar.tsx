import { ActionBar } from "~/components/ActionBar";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SidebarToggle } from "~/components/SidebarToggle";
import { Spacer } from "~/components/Spacer";
import { CLOUD_PAGES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { iconChevronRight } from "~/util/icons";

export interface CloudToolbarProps {
	showBreadcrumb?: boolean;
}

export function CloudToolbar({ showBreadcrumb }: CloudToolbarProps) {
	const activePage = useConfigStore((s) => s.activeCloudPage);
	const pageName = CLOUD_PAGES[activePage]?.name ?? "Unknown";

	return (
		<>
			<SidebarToggle />

			{showBreadcrumb && (
				<>
					<PrimaryTitle
						ml={3}
						visibleFrom="md"
					>
						Surreal Cloud
					</PrimaryTitle>
					<Icon
						path={iconChevronRight}
						visibleFrom="md"
						size="xl"
						color="slate.5"
						mx={-8}
					/>
					<PrimaryTitle>{pageName}</PrimaryTitle>
				</>
			)}

			<Spacer />
			<ActionBar />
		</>
	);
}
