import { ActionIcon, Tooltip } from "@mantine/core";
import { useEffect, useState } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { Icon } from "../../Icon";
import { closeConnection, openConnection } from "~/database";
import { useDatabaseStore } from "~/stores/database";
import { iconConsole, iconPlay, iconStop } from "~/util/icons";
import { useSetting } from "~/hooks/config";
import { useIntent } from "~/hooks/url";

// TODO Check if localhost

const CAT = "serving";

export interface LocalDatabaseProps {
	toggleConsole: () => void;
}

export function LocalDatabase({ toggleConsole }: LocalDatabaseProps) {
	const [hasStarted, setHasStarted] = useState(false);

	const cancelServe = useDatabaseStore((s) => s.cancelServe);
	const prepareServe = useDatabaseStore((s) => s.prepareServe);
	const stopServing = useDatabaseStore((s) => s.stopServing);
	const isServing = useDatabaseStore((s) => s.isServing);
	const isPending = useDatabaseStore((s) => s.servePending);

	const [driver] = useSetting(CAT, "driver");
	const [storage] = useSetting(CAT, "storage");
	const [username] = useSetting(CAT, "username");
	const [password] = useSetting(CAT, "password");
	const [executable] = useSetting(CAT, "executable");
	const [port] = useSetting(CAT, "port");

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

			adapter.startDatabase(username, password, port, driver, storage, executable).catch(() => {
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

	useIntent("toggle-serving", handleToggle);
	useIntent("open-serving-console", toggleConsole);

	return (
		<>
			<Tooltip label={isServing ? "Stop serving" : "Start serving"}>
				<ActionIcon
					w={36}
					h={36}
					onClick={handleToggle}
					loading={isPending}
					color={isServing ? "red.5" : undefined}
				>
					<Icon path={isServing ? iconStop : iconPlay} size="lg" />
				</ActionIcon>
			</Tooltip>

			{hasStarted && (
				<Tooltip label="Open console">
					<ActionIcon
						w={36}
						h={36}
						onClick={toggleConsole}
					>
						<Icon path={iconConsole} size="lg" />
					</ActionIcon>
				</Tooltip>
			)}
		</>
	);
}
