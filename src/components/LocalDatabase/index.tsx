import { Box, Button, Collapse, Loader, Paper } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { mdiConsole, mdiPlay, mdiStop } from "@mdi/js";
import { useEffect, useState } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { Icon } from "../Icon";
import { closeConnection, openConnection } from "~/database";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";

// TODO Check if localhost

export function LocalDatabase() {
	const isLight = useIsLight();
	const enableConsole = useConfigStore((s) => s.enableConsole);
	const [isOpen, setIsOpen] = useState(false);

	const cancelServe = useDatabaseStore((s) => s.cancelServe);
	const prepareServe = useDatabaseStore((s) => s.prepareServe);
	const stopServing = useDatabaseStore((s) => s.stopServing);
	const isServing = useDatabaseStore((s) => s.isServing);
	const isPending = useDatabaseStore((s) => s.servePending);

	const setConsoleEnabled = useConfigStore((s) => s.setConsoleEnabled);
	const localDriver = useConfigStore((s) => s.localDriver);
	const localPath = useConfigStore((s) => s.localStorage);
	const surrealPath = useConfigStore((s) => s.surrealPath);
	const surrealUser = useConfigStore((s) => s.surrealUser);
	const surrealPass = useConfigStore((s) => s.surrealPass);
	const surrealPort = useConfigStore((s) => s.surrealPort);

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
	});

	const toggleConsole = useStable(() => setConsoleEnabled(!enableConsole));

	useEffect(() => {
		if (isServing) {
			openConnection();
		}
	}, [isServing]);

	useHotkeys([["ctrl+s", handleToggle]], []);

	return (
		<Box
			pos="relative"
			h={36}
			w={56}
			mx={-6}
			mt={-14}
		>
			<Paper
				p={6}
				pos="absolute"
				radius={12}
				left={0}
				right={0}
				top={0}
				withBorder
				onMouseEnter={() => setIsOpen(true)}
				onMouseLeave={() => setIsOpen(false)}
				style={{
					transition: 'border-color .2s',
					borderColor: isOpen ? undefined : 'transparent',
					zIndex: 1
				}}
			>
				<Button
					px="xs"
					color={isServing ? "red" : isLight ? "light.0" : "dark.4"}
					title={isServing ? "Stop local database" : "Start local database"}
					style={{ opacity: isPending ? 0.5 : 1 }}
					disabled={isPending}
					onClick={handleToggle}
				>
					{isPending ? (
						<Loader size="xs" color="blue" mx={1} />
					) : (
						<Icon path={isServing ? mdiStop : mdiPlay} color={isServing ? "white" : isLight ? "light.8" : "white"} />
					)}
				</Button>

				<Collapse in={isOpen}>
					<Button
						mt="xs"
						px="xs"
						color={isLight ? "light.0" : "dark.4"}
						title="Toggle console"
						onClick={toggleConsole}
					>
						<Icon path={mdiConsole} color={isLight ? "light.8" : "white"} />
					</Button>
				</Collapse>
			</Paper>
		</Box>
	);
}
