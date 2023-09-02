import { SimpleGrid } from "@mantine/core";
import { AccountsPane } from "../AccountsPane";
import { ScopePane } from "../ScopesPane";
import { mdiDatabaseLock, mdiFolderLock, mdiLock } from "@mdi/js";
import { useIsConnected } from "~/hooks/connection";

export interface AuthenticationViewProps {}

export function AuthenticationView(props: AuthenticationViewProps) {
	const isOnline = useIsConnected();

	return (
		<SimpleGrid cols={4} h="100%" spacing={6}>
			<AccountsPane
				isOnline={isOnline}
				title="Root Users"
				icon={mdiLock}
				iconColor="red.6"
				typeShort="KV"
				typeLong="ROOT"
			/>

			<AccountsPane
				isOnline={isOnline}
				title="Namespace Users"
				icon={mdiFolderLock}
				iconColor="blue.6"
				typeShort="NS"
				typeLong="NAMESPACE"
			/>

			<AccountsPane
				isOnline={isOnline}
				title="Database Users"
				icon={mdiDatabaseLock}
				iconColor="yellow.6"
				typeShort="DB"
				typeLong="DATABASE"
			/>
			<ScopePane isOnline={isOnline} />
		</SimpleGrid>
	);
}
