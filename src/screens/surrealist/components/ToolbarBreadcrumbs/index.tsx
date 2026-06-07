import { Breadcrumbs, Text } from "@mantine/core";
import { BreadcrumbCrumb } from "~/components/BreadcrumbCrumb";
import { SANDBOX } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useConnectionAndView } from "~/hooks/routing";
import { useInterfaceStore } from "~/stores/interface";
import { ConnectionCrumb } from "./connection";
import { DatabaseCrumb } from "./database";

export function ToolbarBreadcrumbs() {
	const pageBreadcrumbs = useInterfaceStore((s) => s.pageBreadcrumbs);

	const [connection] = useConnectionAndView();
	const isConnected = useIsConnected();

	const isSandbox = connection === SANDBOX;
	const showDatabase = !isSandbox && connection && isConnected;

	if (pageBreadcrumbs.length === 0 && !connection) {
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
				<BreadcrumbCrumb
					key={`${item.label}-${index}`}
					item={item}
				/>
			))}

			{connection && <ConnectionCrumb />}

			{showDatabase && <DatabaseCrumb />}
		</Breadcrumbs>
	);
}
