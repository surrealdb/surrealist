import { ActionBar } from "~/components/ActionBar";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SidebarToggle } from "~/components/SidebarToggle";
import { Spacer } from "~/components/Spacer";
import { useActiveCloudPage } from "~/hooks/routing";
import { iconChevronRight } from "~/util/icons";

export interface CloudToolbarProps {
	showBreadcrumb?: boolean;
}

export function CloudToolbar({ showBreadcrumb }: CloudToolbarProps) {
	const [activePage] = useActiveCloudPage();
	const pageName = activePage?.name ?? "Unknown";

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
