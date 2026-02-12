import { Badge, type BadgeProps } from "@mantine/core";

export function BetaBadge(props: BadgeProps) {
	return (
		<Badge
			variant="light"
			radius="xs"
			p={0}
			{...props}
		>
			Beta
		</Badge>
	);
}
