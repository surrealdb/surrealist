import { Icon, iconConsole, iconPlay, iconStop } from "@surrealdb/ui";
import { useEffect, useState } from "react";
import { adapter } from "~/adapter";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { openConnection } from "~/screens/surrealist/pages/Connection/connection/connection";
import { useDatabaseStore } from "~/stores/database";
import { tagEvent } from "~/util/analytics";
import { getConnection } from "~/util/connection";
import { isHostLocal } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "../ActionButton";

export function DatabaseServing() {
	const [hasStarted, setHasStarted] = useState(false);

	const cancelServe = useDatabaseStore((s) => s.cancelServe);
	const prepareServe = useDatabaseStore((s) => s.prepareServe);
	const stopServing = useDatabaseStore((s) => s.stopServing);
	const isServing = useDatabaseStore((s) => s.isServing);
	const isPending = useDatabaseStore((s) => s.servePending);

	const handleToggle = useStable(async () => {
		if (isPending) {
			return;
		}

		if (isServing) {
			adapter.stopDatabase();

			cancelServe();
		} else {
			prepareServe();

			adapter
				.startDatabase()
				.then(() => void tagEvent("database_serve"))
				.catch(() => stopServing());
		}

		setHasStarted(true);
	});

	const openConsole = useStable(() => {
		dispatchIntent("open-serving-console");
	});

	useEffect(() => {
		const connection = getConnection();

		if (connection) {
			const isLocal = isHostLocal(connection.authentication.hostname);

			if (isServing && isLocal) {
				openConnection();
			}
		}
	}, [isServing]);

	useIntent("toggle-serving", handleToggle);

	return (
		<>
			<ActionButton
				onClick={handleToggle}
				loading={isPending}
				label={isServing ? "Stop serving" : "Start serving"}
				tooltipProps={{
					position: "bottom",
					label: isServing ? "Stop serving" : "Start serving",
					children: null,
				}}
				color={isServing ? "pink.6" : undefined}
				aria-label={
					isServing ? "Stop serving local database" : "Start serving local database"
				}
			>
				<Icon
					path={isServing ? iconStop : iconPlay}
					size="lg"
				/>
			</ActionButton>

			{hasStarted && (
				<ActionButton
					onClick={openConsole}
					label="Open console"
					tooltipProps={{
						position: "bottom",
						label: "Open console",
						children: null,
					}}
				>
					<Icon
						path={iconConsole}
						size="lg"
					/>
				</ActionButton>
			)}
		</>
	);
}
