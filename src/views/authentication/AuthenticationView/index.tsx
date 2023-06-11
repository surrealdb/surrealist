import { SimpleGrid } from '@mantine/core';
import { AccountsPane } from '../AccountsPane';
import { ScopePane } from '../ScopesPane';
import { mdiDatabaseLock, mdiFolderLock } from '@mdi/js';
import { useIsConnected } from '~/hooks/connection';

export interface AuthenticationViewProps {}

export function AuthenticationView(props: AuthenticationViewProps) {
	const isOnline = useIsConnected();

	return (
		<SimpleGrid cols={3} h='100%' spacing={6}>
			<AccountsPane
				title='Namespace Logins'
				icon={mdiFolderLock}
				iconColor='red.6'
				typeShort='NS'
				typeLong='NAMESPACE'
			/>

			<AccountsPane
				title='Database Logins'
				icon={mdiDatabaseLock}
				iconColor='yellow.6'
				typeShort='DB'
				typeLong='DATABASE'
			/>
			<ScopePane />
		</SimpleGrid>
	);
}
