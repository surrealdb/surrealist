import { ContentPane } from "~/components/Pane";
import { iconAuth, iconFolderSecure } from "~/util/icons";

export function AccessEditorPanel() {
	return (
		<ContentPane
			title="Access Editor"
			icon={iconFolderSecure}
			// infoSection={
			// 	isCreating && (
			// 		<Badge ml="xs" variant="light">
			// 			Creating
			// 		</Badge>
			// 	)
			// }
			// rightSection={
			// 	<Tooltip label="Format function">
			// 		<ActionIcon
			// 			onClick={formatFunction}
			// 			aria-label="Format function"
			// 		>
			// 			<Icon path={iconText} />
			// 		</ActionIcon>
			// 	</Tooltip>
			// }
		>
			Test
		</ContentPane>
	);
}