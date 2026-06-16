import { DatasetCatalogBrowser } from "~/components/DatasetCatalog/browser";
import { useMinimumVersion } from "~/hooks/connection";

export interface DatasetBrowserProps {
	disabled: boolean;
}

export function DatasetBrowser({ disabled }: DatasetBrowserProps) {
	const [, connectedVersion] = useMinimumVersion("0.0.0");
	const dbVersion = connectedVersion || import.meta.env.SDB_VERSION;

	return (
		<DatasetCatalogBrowser
			surrealVersion={dbVersion}
			variant="apply"
			versionResolution="database"
			disabled={disabled}
		/>
	);
}
