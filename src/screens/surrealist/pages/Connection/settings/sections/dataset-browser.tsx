import { DatasetCatalogBrowser } from "~/components/DatasetCatalog/browser";
import { useMinimumVersion } from "~/hooks/connection";

export function DatasetBrowser() {
	const [, connectedVersion] = useMinimumVersion("0.0.0");
	const dbVersion = connectedVersion || import.meta.env.SDB_VERSION;

	return (
		<DatasetCatalogBrowser
			surrealVersion={dbVersion}
			variant="apply"
		/>
	);
}
