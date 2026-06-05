import { Breadcrumbs, Menu, Text } from "@mantine/core";
import { BreadcrumbButton, Icon, iconChevronY, iconDatabase } from "@surrealdb/ui";
import clsx from "clsx";
import { Link } from "wouter";
import { SANDBOX } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useConnectionAndView } from "~/hooks/routing";
import { useRootSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { openCreateNamespaceModal } from "~/modals/create-namespace";
import { useInterfaceStore } from "~/stores/interface";
import { getAuthLevel, getAuthNS } from "~/util/connection";
import { createBaseAuthentication } from "~/util/defaults";
import { parseIdent } from "~/util/language";
import { DatabaseSelector } from "../DatabaseSelector";
import { ConnectionCrumb } from "./ConnectionCrumb";

export function ToolbarBreadcrumbs() {
	const pageBreadcrumbs = useInterfaceStore((s) => s.pageBreadcrumbs);
	const [opened, openHandle] = useBoolean();

	const [routeConnection] = useConnectionAndView();
	const isConnected = useIsConnected();
	const rootSchema = useRootSchema();

	const [id, namespace, database, authentication] = useConnection((c) => [
		c?.id,
		c?.lastNamespace,
		c?.lastDatabase,
		c?.authentication ?? createBaseAuthentication(),
	]);

	const level = getAuthLevel(authentication);
	const authNS = getAuthNS(authentication);

	const isSandbox = id === SANDBOX;
	const showDatabase = !isSandbox && id && isConnected && routeConnection;

	const namespaces = authNS ? [authNS] : rootSchema.namespaces.map((ns) => parseIdent(ns.name));

	const willCreateNamespace =
		level === "root" && namespaces.length === 0 && !namespace && isConnected;

	const openNamespaceCreator = useStable(() => {
		openCreateNamespaceModal();
		openHandle.close();
	});

	if (pageBreadcrumbs.length === 0 && !routeConnection) {
		return null;
	}

	return (
		<Breadcrumbs
			flex={1}
			miw={0}
			separator={
				<Text
					opacity={0.3}
					size="xl"
				>
					/
				</Text>
			}
		>
			{pageBreadcrumbs.map((item, index) =>
				item.href ? (
					<Link
						key={`${item.label}-${index}`}
						href={item.href}
					>
						<BreadcrumbButton className={clsx(item.selectable && "selectable")}>
							<Text
								truncate
								maw={200}
							>
								{item.label}
							</Text>
						</BreadcrumbButton>
					</Link>
				) : (
					<BreadcrumbButton
						key={`${item.label}-${index}`}
						className={clsx(item.selectable && "selectable")}
					>
						<Text
							truncate
							maw={200}
						>
							{item.label}
						</Text>
					</BreadcrumbButton>
				),
			)}

			<ConnectionCrumb />

			{showDatabase &&
				(willCreateNamespace ? (
					<BreadcrumbButton
						leftSection={<Icon path={iconDatabase} />}
						onClick={openNamespaceCreator}
					>
						<Text truncate>Create namespace</Text>
					</BreadcrumbButton>
				) : (
					<Menu
						opened={opened}
						onChange={openHandle.set}
						position="bottom-start"
						transitionProps={{ transition: "pop-top-left" }}
					>
						<Menu.Target>
							<BreadcrumbButton
								leftSection={
									<Icon
										path={iconDatabase}
										c="bright"
									/>
								}
								rightSection={
									<Icon
										path={iconChevronY}
										size="xs"
										opacity={0.6}
									/>
								}
							>
								{database ? (
									<Text
										truncate
										maw={200}
										className="selectable"
									>
										{database}
									</Text>
								) : (
									<Text opacity={0.6}>Select a database</Text>
								)}
							</BreadcrumbButton>
						</Menu.Target>
						<Menu.Dropdown w={250}>
							<DatabaseSelector opened={opened} />
						</Menu.Dropdown>
					</Menu>
				))}
		</Breadcrumbs>
	);
}
