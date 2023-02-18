import { SimpleGrid } from "@mantine/core";
import { AccountsPane } from "../AccountsPane";
import { ScopePane } from "../ScopesPane";
import { mdiDatabaseLock, mdiFolderLock } from "@mdi/js";

export interface AuthenticationViewProps {
	isOnline: boolean;
}

export function AuthenticationView(props: AuthenticationViewProps) {
	return (
		<SimpleGrid
			cols={3}
			h="100%"
			spacing={6}
		>
			<AccountsPane
				title="Namespace Logins"
				icon={mdiFolderLock}
				isOnline={props.isOnline}
				iconColor="red.6"
				typeShort="NS"
				typeLong="NAMESPACE"
				field="nl"
			/>

			<AccountsPane
				title="Database Logins"
				icon={mdiDatabaseLock}
				isOnline={props.isOnline}
				iconColor="yellow.6"
				typeShort="DB"
				typeLong="DATABASE"
				field="dl"
			/>

			<ScopePane
				isOnline={props.isOnline}
			/>
		</SimpleGrid>
	);
}