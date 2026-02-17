import { Icon, iconChevronRight } from "@surrealdb/ui";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { ActionButton } from "../ActionButton";

export function SidebarToggle() {
	const { setOverlaySidebar } = useInterfaceStore.getState();
	const overlaySidebar = useInterfaceStore((s) => s.overlaySidebar);

	const toggleSidebar = useStable(() => {
		setOverlaySidebar(!overlaySidebar);
	});

	return (
		<ActionButton
			size="lg"
			hiddenFrom="md"
			label="Toggle sidebar"
			onClick={toggleSidebar}
		>
			<Icon path={iconChevronRight} />
		</ActionButton>
	);
}
