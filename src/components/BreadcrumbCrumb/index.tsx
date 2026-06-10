import { ButtonProps } from "@mantine/core";
import { BreadcrumbButton } from "@surrealdb/ui";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import type { BreadcrumbItem } from "~/types";

export interface BreadcrumbCrumbProps extends ButtonProps {
	item: BreadcrumbItem;
	leftSection?: React.ReactNode;
	rightSection?: React.ReactNode;
	onClick?: () => void;
}

export function BreadcrumbCrumb({
	item,
	leftSection,
	rightSection,
	onClick,
	...other
}: BreadcrumbCrumbProps) {
	const [, navigate] = useAbsoluteLocation();

	const navigateToHref = useStable(() => {
		if (item.href) {
			navigate(item.href);
		}
	});

	const handleClick = onClick ?? (item.href ? navigateToHref : undefined);

	return (
		<BreadcrumbButton
			onClick={handleClick}
			leftSection={leftSection}
			rightSection={rightSection}
			{...other}
		>
			{item.label}
		</BreadcrumbButton>
	);
}
