import { ActionIcon, type ActionIconProps, Menu, Tooltip } from '@mantine/core';
import { HTMLPropsRef, MRT_TableInstance } from 'mantine-react-table';
import { ShowHideColumnsMenu } from './ShowHideColumnsMenu';
import { mdiTable } from '@mdi/js';
import { Icon } from '../Icon';

interface Props<TData extends Record<string, any> = {}>
	extends ActionIconProps,
		HTMLPropsRef<HTMLButtonElement> {
	table: MRT_TableInstance<TData>;
}

export const ShowHideColumnsButton = <TData extends Record<string, any> = {}>({
	table,
}: Props<TData>) => {
	const {
		options: {
			icons: { IconColumns },
			localization,
		},
	} = table;

	return (
		<Menu closeOnItemClick={false} withinPortal>
			<Menu.Target>
				<ActionIcon title="Show/Hide columns">
					<Icon color="light.4" path={mdiTable} />
				</ActionIcon>
			</Menu.Target>
			<ShowHideColumnsMenu table={table} />
		</Menu>
	);
};
