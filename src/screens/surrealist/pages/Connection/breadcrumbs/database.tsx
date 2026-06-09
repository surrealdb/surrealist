import { Menu } from "@mantine/core";
import { Icon, iconChevronY, iconDatabase } from "@surrealdb/ui";
import { useState } from "react";
import { BreadcrumbCrumb } from "~/components/BreadcrumbCrumb";
import { useConnection } from "~/hooks/connection";
import { DatabaseSelector } from "~/screens/surrealist/components/DatabaseSelector";

export function DatabaseCrumb() {
	const [isDropped, setIsDropped] = useState(false);

	const database = useConnection((c) => c?.lastDatabase);

	return (
		<Menu
			opened={isDropped}
			onChange={setIsDropped}
			trigger="hover"
			position="bottom-start"
			transitionProps={{ transition: "scale-y" }}
		>
			<Menu.Target>
				<BreadcrumbCrumb
					item={{
						label: database || "Select a database",
						selectable: !!database,
						dimmed: !database,
					}}
					leftSection={
						<Icon
							path={iconDatabase}
							opacity={0.75}
						/>
					}
					rightSection={
						<Icon
							path={iconChevronY}
							size="xs"
							opacity={0.6}
						/>
					}
				/>
			</Menu.Target>
			<Menu.Dropdown miw={300}>
				<DatabaseSelector opened={isDropped} />
			</Menu.Dropdown>
		</Menu>
	);
}
