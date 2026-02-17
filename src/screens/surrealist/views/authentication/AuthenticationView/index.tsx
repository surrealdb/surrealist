import { Box } from "@mantine/core";
import { iconDatabaseSecure, iconFolderSecure, iconServerSecure } from "@surrealdb/ui";
import { memo, useMemo } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { SidekickPanel } from "~/components/Sidekick/panel";
import { useConnection } from "~/hooks/connection";
import { useViewFocus } from "~/hooks/routing";
import { useDatabaseSchema, useNamespaceSchema, useRootSchema } from "~/hooks/schema";
import { syncConnectionSchema } from "~/util/schema";
import { LevelPanel } from "../LevelPanel";

const LevelPanelLazy = memo(LevelPanel);

export function AuthenticationView() {
	const kvSchema = useRootSchema();
	const nsSchema = useNamespaceSchema();
	const dbSchema = useDatabaseSchema();

	const [namespace, database] = useConnection((c) => [
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
	]);

	const rootUsers = useMemo(() => kvSchema.users, [kvSchema.users]);
	const namespaceUsers = useMemo(() => nsSchema.users, [nsSchema.users]);
	const databaseUsers = useMemo(() => dbSchema.users, [dbSchema.users]);

	const rootAccesses = useMemo(() => kvSchema.accesses, [kvSchema.accesses]);
	const namespaceAccesses = useMemo(() => nsSchema.accesses, [nsSchema.accesses]);
	const databaseAccesses = useMemo(() => dbSchema.accesses, [dbSchema.accesses]);

	useViewFocus("authentication", () => {
		syncConnectionSchema();
	});

	return (
		<Box
			h="100%"
			pr="lg"
			pb="lg"
			pl={{ base: "lg", md: 0 }}
		>
			<PanelGroup direction="horizontal">
				<Panel minSize={15}>
					<LevelPanelLazy
						level="ROOT"
						color="red"
						icon={iconServerSecure}
						users={rootUsers}
						accesses={rootAccesses}
					/>
				</Panel>
				<PanelDragger />
				<Panel minSize={15}>
					<LevelPanelLazy
						level="NAMESPACE"
						color="blue"
						icon={iconFolderSecure}
						users={namespaceUsers}
						accesses={namespaceAccesses}
						disabled={
							!namespace && {
								message:
									"You need to select a namespace before viewing namespace authentication",
								selector: { withNamespace: true },
							}
						}
					/>
				</Panel>
				<PanelDragger />
				<Panel minSize={15}>
					<LevelPanelLazy
						level="DATABASE"
						color="orange"
						icon={iconDatabaseSecure}
						users={databaseUsers}
						accesses={databaseAccesses}
						disabled={
							!database && {
								message:
									"You need to select a database before viewing database authentication",
								selector: { withDatabase: true },
							}
						}
					/>
				</Panel>
				<SidekickPanel />
			</PanelGroup>
		</Box>
	);
}

export default AuthenticationView;
