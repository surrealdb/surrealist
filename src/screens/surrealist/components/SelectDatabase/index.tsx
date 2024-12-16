import { type BoxProps, Group } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { iconChevronRight } from "~/util/icons";
import { DatabaseList } from "../DatabaseList";
import { NamespaceList } from "../NamespaceList";

const STYLE = {
	border: "1px solid rgba(255, 255, 255, 0.3)",
	backgroundOrigin: "border-box",
};

export interface SelectDatabaseProps extends BoxProps {
	withNamespace?: boolean;
	withDatabase?: boolean;
}

export function SelectDatabase({ withNamespace, withDatabase, ...other }: SelectDatabaseProps) {
	const namespace = useConnection((c) => c?.lastNamespace);
	const isConnected = useIsConnected();

	const showNS = !!withNamespace;
	const showDB = !!withDatabase;

	const nsDisabled = !isConnected;
	const dbDisabled = !isConnected || !namespace;

	return (
		<Group {...other}>
			{showNS && (
				<NamespaceList
					buttonProps={{
						flex: 1,
						disabled: nsDisabled,
						variant: namespace ? "light" : "gradient",
						style: nsDisabled || namespace ? undefined : STYLE,
					}}
				/>
			)}

			{showNS && showDB && (
				<Icon
					path={iconChevronRight}
					size="xl"
					color="slate.5"
					mx="md"
				/>
			)}

			{showDB && (
				<DatabaseList
					buttonProps={{
						flex: 1,
						disabled: dbDisabled,
						variant: namespace ? "gradient" : "light",
						style: dbDisabled ? undefined : STYLE,
					}}
				/>
			)}
		</Group>
	);
}
