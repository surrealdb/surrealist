import { Badge, BadgeProps } from "@mantine/core";

export interface UnresolvedBadgeProps extends BadgeProps {
	count: number;
}

export function UnresolvedBadge({ count, ...other }: UnresolvedBadgeProps) {
	return (
		<Badge
			color="orange"
			variant="light"
			ml="sm"
			size="sm"
			{...other}
		>
			{count >= 1024 ? `${count}+` : count} unresolved
		</Badge>
	);
}
