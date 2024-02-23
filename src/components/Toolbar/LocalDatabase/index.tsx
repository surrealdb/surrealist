import { ActionIcon } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { Icon } from "../../Icon";
import { closeConnection, openConnection } from "~/database";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { iconConsole, iconPlay, iconStop } from "~/util/icons";

// TODO Check if localhost

export interface LocalDatabaseProps {
	toggleConsole: () => void;
}

export function LocalDatabase(props: LocalDatabaseProps) {
	const [hasStarted, setHasStarted] = useState(false);

	const cancelServe = useDatabaseStore((s) => s.cancelServe);
	const prepareServe = useDatabaseStore((s) => s.prepareServe);
	const stopServing = useDatabaseStore((s) => s.stopServing);
	const isServing = useDatabaseStore((s) => s.isServing);
	const isPending = useDatabaseStore((s) => s.servePending);

	const localDriver = useConfigStore((s) => s.localSurrealDriver);
	const localPath = useConfigStore((s) => s.localSurrealPath);
	const surrealPath = useConfigStore((s) => s.localSurrealPath);
	const surrealUser = useConfigStore((s) => s.localSurrealUser);
	const surrealPass = useConfigStore((s) => s.localSurrealPass);
	const surrealPort = useConfigStore((s) => s.localSurrealPort);

	const handleToggle = useStable(() => {
		if (isPending) {
			return;
		}

		if (isServing) {
			closeConnection();
			adapter.stopDatabase();

			cancelServe();
		} else {
			prepareServe();

			adapter.startDatabase(surrealUser, surrealPass, surrealPort, localDriver, localPath, surrealPath).catch(() => {
				stopServing();
			});
		}
		
		setHasStarted(true);
	});
	
	useEffect(() => {
		if (isServing) {
			openConnection();
		}
	}, [isServing]);

	useHotkeys([["ctrl+s", handleToggle]], []);

	// <Button
	// 	mt="xs"
	// 	px="xs"
	// 	color={isLight ? "light.0" : "dark.4"}
	// 	title="Toggle console"
	// 	onClick={() => {}}
	// >
	// 	<Icon path={mdiConsole} color={isLight ? "light.8" : "white"} />
	// </Button>

	return (
		<>
			<ActionIcon
				size="xl"
				title={isServing ? "Stop serving" : "Start serving"}
				onClick={handleToggle}
				loading={isPending}
				color={isServing ? "red.5" : undefined}
			>
				<Icon path={isServing ? iconStop : iconPlay} />
			</ActionIcon>

			{hasStarted && (
				<ActionIcon
					size="xl"
					title="Import database from file"
					onClick={props.toggleConsole}
				>
					<Icon path={iconConsole} />
				</ActionIcon>
			)}
		</>
	);
}
