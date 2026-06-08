import { Breadcrumbs, Text } from "@mantine/core";
import { Fragment } from "react";
import { BreadcrumbCrumb } from "~/components/BreadcrumbCrumb";
import { useInterfaceStore } from "~/stores/interface";

export function ToolbarBreadcrumbs() {
	const pageBreadcrumbs = useInterfaceStore((s) => s.pageBreadcrumbs);

	if (pageBreadcrumbs.length === 0) {
		return null;
	}

	return (
		<Breadcrumbs
			miw={0}
			separator={
				<Text
					opacity={0.3}
					size="xl"
				>
					/
				</Text>
			}
		>
			{pageBreadcrumbs.map((item, index) => (
				<Fragment key={`${item.label}-${index}`}>
					{item.content ?? <BreadcrumbCrumb item={item} />}
				</Fragment>
			))}
		</Breadcrumbs>
	);
}
