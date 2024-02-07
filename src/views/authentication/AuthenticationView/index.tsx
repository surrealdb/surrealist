import { SimpleGrid } from "@mantine/core";
import { AccountsPane } from "../AccountsPane";
import { ScopePane } from "../ScopesPane";
import { mdiDatabaseLock, mdiFolderLock, mdiLock } from "@mdi/js";
import { useIsConnected } from "~/hooks/connection";

export interface AuthenticationViewProps {}

export function AuthenticationView(props: AuthenticationViewProps) {
	const isOnline = useIsConnected();

	return (
		<SimpleGrid
			h="100%"
			spacing={6}
			cols={{
				base: 4,
				lg: 2
			}}
			style={{
				gridAutoRows: '1fr'
			}}
		>
			<AccountsPane
				isOnline={isOnline}
				title="Root Users"
				icon={mdiLock}
				iconColor="red.6"
				field="kvUsers"
				type="ROOT"
			/>

			<AccountsPane
				isOnline={isOnline}
				title="Namespace Users"
				icon={mdiFolderLock}
				iconColor="blue.6"
				field="nsUsers"
				type="NAMESPACE"
			/>

			<AccountsPane
				isOnline={isOnline}
				title="Database Users"
				icon={mdiDatabaseLock}
				iconColor="yellow.6"
				field="dbUsers"
				type="DATABASE"
			/>
			<ScopePane />
		</SimpleGrid>
	);
}
