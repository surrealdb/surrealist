import { ActionIcon, Tooltip } from "@mantine/core";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { openConnection } from "~/screens/database/connection/connection";
import { useDatabaseStore } from "~/stores/database";
import { getActiveConnection } from "~/util/connection";
import { iconConsole, iconPlay, iconStop } from "~/util/icons";
import { Icon } from "../Icon";

export function DatabaseServing() {
	const [hasStarted, setHasStarted] = useState(false);

	const cancelServe = useDatabaseStore((s) => s.cancelServe);
	const prepareServe = useDatabaseStore((s) => s.prepareServe);
	const stopServing = useDatabaseStore((s) => s.stopServing);
	const isServing = useDatabaseStore((s) => s.isServing);
	const isPending = useDatabaseStore((s) => s.servePending);

	const handleToggle = useStable(() => {
		if (isPending) {
			return;
		}

		if (isServing) {
			adapter.stopDatabase();

			cancelServe();
		} else {
			prepareServe();

			adapter.startDatabase().catch(() => {
				stopServing();
			});

			posthog.capture("serve_start");
		}

		setHasStarted(true);
	});

	const openConsole = useStable(() => {
		dispatchIntent("open-serving-console");
	});

	useEffect(() => {
		const {
			authentication: { hostname },
		} = getActiveConnection();
		const isLocal =
			hostname.startsWith("localhost") ||
			hostname.startsWith("127.0.0.1");

		if (isServing && isLocal) {
			openConnection();
		}
	}, [isServing]);

	useIntent("toggle-serving", handleToggle);

	return (
		<>
			<Tooltip label={isServing ? "Stop serving" : "Start serving"}>
				<ActionIcon
					w={36}
					h={36}
					onClick={handleToggle}
					loading={isPending}
					color={isServing ? "pink.7" : undefined}
					aria-label={
						isServing
							? "Stop serving local database"
							: "Start serving local database"
					}
					variant="subtle"
				>
					<Icon path={isServing ? iconStop : iconPlay} size="lg" />
				</ActionIcon>
			</Tooltip>

			{hasStarted && (
				<Tooltip label="Open console">
					<ActionIcon
						w={36}
						h={36}
						onClick={openConsole}
						aria-label="Open serving console drawer"
						variant="subtle"
					>
						<Icon path={iconConsole} size="lg" />
					</ActionIcon>
				</Tooltip>
			)}
		</>
	);
}
