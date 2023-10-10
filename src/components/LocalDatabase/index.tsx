import { Box, Button, Collapse, Loader, Paper } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { mdiConsole, mdiPlay, mdiStop } from "@mdi/js";
import { useEffect, useState } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { store, useStoreValue } from "~/store";
import { Icon } from "../Icon";
import { closeConnection, openConnection } from "~/database";
import { setConsoleEnabled } from "~/stores/config";
import { cancelServe, prepareServe, stopServing } from "~/stores/database";

// TODO Check if localhost

export function LocalDatabase() {
	const isLight = useIsLight();
	const enableConsole = useStoreValue((state) => state.config.enableConsole);
	const [isOpen, setIsOpen] = useState(false);

	const isServing = useStoreValue((state) => state.database.isServing);
	const isPending = useStoreValue((state) => state.database.servePending);
	const localDriver = useStoreValue((state) => state.config.localDriver);
	const localPath = useStoreValue((state) => state.config.localStorage);
	const surrealPath = useStoreValue((state) => state.config.surrealPath);
	const surrealUser = useStoreValue((state) => state.config.surrealUser);
	const surrealPass = useStoreValue((state) => state.config.surrealPass);
	const surrealPort = useStoreValue((state) => state.config.surrealPort);

	const handleToggle = useStable(() => {
		if (isPending) {
			return;
		}

		if (isServing) {
			closeConnection();
			adapter.stopDatabase();

			store.dispatch(cancelServe());
		} else {
			store.dispatch(prepareServe());

			adapter.startDatabase(surrealUser, surrealPass, surrealPort, localDriver, localPath, surrealPath).catch(() => {
				store.dispatch(stopServing());
			});
		}
	});

	const toggleConsole = useStable(() => {
		store.dispatch(setConsoleEnabled(!enableConsole));
	});

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
