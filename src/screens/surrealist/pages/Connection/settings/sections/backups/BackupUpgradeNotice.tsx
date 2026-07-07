import { Button, Divider, Group, Text } from "@mantine/core";
import { Icon, iconChevronRight } from "@surrealdb/ui";

export interface BackupUpgradeNoticeProps {
	message: string;
	actionLabel: string;
	onAction: () => void;
}

/**
 * A footer rendered inside a backup setting card to promote a feature that is
 * only available on higher instance plans, alongside a call-to-action.
 * Intended to be placed as the last child of the setting's card.
 */
export function BackupUpgradeNotice({ message, actionLabel, onAction }: BackupUpgradeNoticeProps) {
	return (
		<>
			<Divider my="lg" />
			<Group
				align="center"
				justify="space-between"
				wrap="nowrap"
				gap="lg"
			>
				<Text
					fz="sm"
					fw={500}
				>
					{message}
				</Text>
				<Button
					flex="0 0 auto"
					size="xs"
					variant="gradient"
					rightSection={<Icon path={iconChevronRight} />}
					onClick={onAction}
				>
					{actionLabel}
				</Button>
			</Group>
		</>
	);
}
