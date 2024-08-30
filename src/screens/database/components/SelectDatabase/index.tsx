import { BoxProps, Group } from "@mantine/core";
import { iconChevronRight } from "~/util/icons";
import { DatabaseList } from "../DatabaseList";
import { NamespaceList } from "../NamespaceList";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { Icon } from "~/components/Icon";

const STYLE = {
	border: '1px solid rgba(255, 255, 255, 0.3)',
	backgroundOrigin: 'border-box',
};

export function SelectDatabase(props: BoxProps) {
	const connection = useConnection();
	const isConnected = useIsConnected();

	const nsDisabled = !isConnected;
	const dbDisabled = !isConnected || !connection?.lastNamespace;

	return (
		<Group {...props}>
			<NamespaceList
				buttonProps={{
					flex: 1,
					disabled: nsDisabled,
					variant: connection?.lastNamespace ? "light" : "gradient",
					style: (nsDisabled || connection?.lastNamespace) ? undefined : STYLE
				}}
			/>

			<Icon
				path={iconChevronRight}
				size="xl"
				color="slate.5"
				mx="md"
			/>

			<DatabaseList
				buttonProps={{
					flex: 1,
					disabled: dbDisabled,
					variant: connection?.lastNamespace ? "gradient" : "light",
					style: dbDisabled ? undefined : STYLE
				}}
			/>
		</Group>
	);
}