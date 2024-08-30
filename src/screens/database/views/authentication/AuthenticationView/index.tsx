import { SimpleGrid } from "@mantine/core";
import { AccountsPane } from "../AccountsPane";
import { ScopePane } from "../ScopesPane";
import { useIsConnected } from "~/hooks/connection";
import { iconAuth, iconFolderSecure, iconServerSecure } from "~/util/icons";
import { useViewEffect } from "~/hooks/view";
import { syncDatabaseSchema } from "~/util/schema";
import { memo } from "react";

const AccountsPaneLazy = memo(AccountsPane);
const ScopePaneLazy = memo(ScopePane);

export function AuthenticationView() {
	const isOnline = useIsConnected();

	useViewEffect("authentication", () => {
		syncDatabaseSchema();
	});

	return (
		<SimpleGrid
			h="100%"
			spacing={6}
			cols={{
				base: 2,
				lg: 4
			}}
			style={{
				gridAutoRows: '1fr'
			}}
		>
			<AccountsPaneLazy
				isOnline={isOnline}
				title="Root Users"
				icon={iconAuth}
				iconColor="red.6"
				field="kvUsers"
				type="ROOT"
			/>

			<AccountsPaneLazy
				isOnline={isOnline}
				title="Namespace Users"
				icon={iconFolderSecure}
				iconColor="blue.6"
				field="nsUsers"
				type="NAMESPACE"
			/>

			<AccountsPaneLazy
				isOnline={isOnline}
				title="Database Users"
				icon={iconServerSecure}
				iconColor="yellow.6"
				field="dbUsers"
				type="DATABASE"
			/>
			<ScopePaneLazy />
		</SimpleGrid>
	);
}

export default AuthenticationView;
