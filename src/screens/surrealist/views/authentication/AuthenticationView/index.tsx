import { Box } from "@mantine/core";
import { memo, useMemo } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { useConnection } from "~/hooks/connection";
import { useViewFocus } from "~/hooks/routing";
import { useDatabaseSchema, useNamespaceSchema, useRootSchema } from "~/hooks/schema";
import { iconDatabaseSecure, iconFolderSecure, iconServerSecure } from "~/util/icons";
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

	const users = useMemo(
		() => [...kvSchema.users, ...nsSchema.users, ...dbSchema.users],
		[kvSchema.users, nsSchema.users, dbSchema.users],
	);

	const accesses = useMemo(
		() => [...kvSchema.accesses, ...nsSchema.accesses, ...dbSchema.accesses],
		[kvSchema.accesses, nsSchema.accesses, dbSchema.accesses],
	);

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
						users={users}
						accesses={accesses}
					/>
				</Panel>
				<PanelDragger />
				<Panel minSize={15}>
					<LevelPanelLazy
						level="NAMESPACE"
						color="blue"
						icon={iconFolderSecure}
						users={users}
						accesses={accesses}
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
						users={users}
						accesses={accesses}
						disabled={
							!database && {
								message:
									"You need to select a database before viewing database authentication",
								selector: { withDatabase: true },
							}
						}
					/>
				</Panel>
			</PanelGroup>
		</Box>
	);
}

export default AuthenticationView;
