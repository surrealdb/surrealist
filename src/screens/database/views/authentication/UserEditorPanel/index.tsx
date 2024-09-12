import { ContentPane } from "~/components/Pane";
import { iconAccount } from "~/util/icons";

export function UserEditorPanel() {
	return (
		<ContentPane
			title="User Editor"
			icon={iconAccount}
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