import { ActionIcon, Tooltip } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { iconChevronRight } from "~/util/icons";
import { Icon } from "../Icon";

export function SidebarToggle() {
	const { setOverlaySidebar } = useInterfaceStore.getState();
	const overlaySidebar = useInterfaceStore((s) => s.overlaySidebar);
	
	const toggleSidebar = useStable(() => {
		setOverlaySidebar(!overlaySidebar);
	});

	return (
		<Tooltip
			label="Toggle sidebar"
			position="right"
		>
			<ActionIcon
				size="lg"
				hiddenFrom="md"
				onClick={toggleSidebar}
			>
				<Icon path={iconChevronRight} />
			</ActionIcon>
		</Tooltip>
	);
}