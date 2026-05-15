import {
	Anchor,
	Badge,
	Box,
	Divider,
	Group,
	Image,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import {
	Icon,
	iconArrowUpRight,
	iconBookmark,
	iconChat,
	iconChevronRight,
	iconCog,
	iconCreditCard,
	iconDollar,
	iconOrganization,
	iconProgressClock,
	iconSpectron,
	iconSurreal,
	pictoSpectronGradient,
	pictoSurrealDBGradient,
} from "@surrealdb/ui";
import { Fragment, useMemo } from "react";
import {
	hasOrganizationRoles,
	isBillingManaged,
	ORG_ROLES_ADMIN,
	ORG_ROLES_OWNER,
	ORG_ROLES_SUPPORT,
} from "~/cloud/helpers";
import { useCloudOrganizationContextsQuery } from "~/cloud/queries/contexts";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useHasCloudFeature } from "~/hooks/cloud";
import { plural } from "~/util/helpers";
import { useSidebar } from "../../../sidebar/portal";
import classes from "../style.module.scss";
import type { OrganizationTabProps } from "../types";

interface ResourceCardProps {
	name: string;
	description: string;
	subject: string;
	icon: string;
	image: string;
	color: string;
	count: number;
	onClick: () => void;
	featured?: boolean;
}

function ResourceCard({
	name,
	description,
	subject,
	icon,
	image,
	color,
	count,
	onClick,
	featured = false,
}: ResourceCardProps) {
	return (
		<Anchor
			variant="glow"
			c="var(--mantine-color-text)"
			onClick={onClick}
			style={{ cursor: "pointer" }}
		>
			<Paper
				p="xl"
				className={featured ? classes.featuredCard : undefined}
			>
				<Group
					gap="md"
					pos="relative"
					style={{ zIndex: 1 }}
				>
					<ThemeIcon
						color={color}
						variant="gradient"
						size={48}
						radius="md"
					>
						<Icon
							size="xl"
							path={icon}
						/>
					</ThemeIcon>
					<Box>
						<Group
							gap="sm"
							wrap="nowrap"
						>
							<Text
								c="bright"
								fw={600}
								fz="lg"
							>
								{name}
							</Text>
							{featured && (
								<Badge
									size="sm"
									radius="sm"
									fw={700}
									className={classes.newBadge}
								>
									NEW
								</Badge>
							)}
						</Group>
						<Text
							fz="sm"
							className="selectable"
						>
							{description}
						</Text>
					</Box>
				</Group>
				<Group
					gap={4}
					mt="lg"
					c="var(--mantine-color-violet-light-color)"
					mb={-4}
					pos="relative"
					style={{ zIndex: 1 }}
				>
					{count > 0 ? (
						<Text
							fz="sm"
							fw={500}
							c="inherit"
						>
							View {plural(count, "", "all")} {count} {plural(count, subject)}
						</Text>
					) : (
						<Text
							fz="sm"
							fw={500}
							c="inherit"
						>
							Get started with {plural(2, subject)}
						</Text>
					)}
					<Icon
						path={iconChevronRight}
						size="sm"
					/>
				</Group>
				<Box
					style={{ overflow: "hidden" }}
					pos="absolute"
					bottom={0}
					right={0}
					top={0}
					w={180}
				>
					<Box
						pos="relative"
						maw="100%"
						mah="100%"
						h="100%"
						w="100%"
						style={{ overflow: "hidden" }}
					>
						<Image
							src={image}
							alt=""
							aria-hidden
							className={featured ? classes.featuredImage : undefined}
							w={150}
							pos="absolute"
							bottom={featured ? -40 : -45}
							right={featured ? -25 : -32}
							style={{
								mixBlendMode: "plus-lighter",
								filter: featured ? undefined : "grayscale(100%)",
								opacity: featured ? 0.55 : 0.2,
							}}
						/>
					</Box>
				</Box>
			</Paper>
		</Anchor>
	);
}

interface ManageItemProps {
	name: string;
	description: string;
	icon: string;
	onClick: () => void;
	extra?: string;
}

function ManageItem({ name, description, icon, onClick, extra }: ManageItemProps) {
	return (
		<UnstyledButton onClick={onClick}>
			<Anchor
				variant="glow"
				c="var(--mantine-color-text)"
				component="span"
			>
				<Paper
					px="md"
					py="sm"
				>
					<Group
						wrap="nowrap"
						gap="md"
					>
						<ThemeIcon
							color="obsidian"
							variant="light"
							size="lg"
						>
							<Icon path={icon} />
						</ThemeIcon>
						<Box
							flex={1}
							miw={0}
						>
							<Text
								c="bright"
								fw={600}
							>
								{name}
							</Text>
							<Text
								fz="sm"
								truncate
								className="selectable"
							>
								{description}
							</Text>
						</Box>
						{extra && (
							<Badge
								fz="xs"
								fw={500}
								variant="light"
							>
								{extra}
							</Badge>
						)}
						<Icon
							path={iconChevronRight}
							size="sm"
							c="bright"
							style={{ opacity: 0.4 }}
						/>
					</Group>
				</Paper>
			</Anchor>
		</UnstyledButton>
	);
}

interface DocLinkProps {
	label: string;
	href: string;
}

function DocLink({ label, href }: DocLinkProps) {
	return (
		<Anchor
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			fz="sm"
		>
			<Group
				gap="sm"
				wrap="nowrap"
			>
				<Icon
					path={iconBookmark}
					size="md"
					c="slate"
				/>
				{label}
				<Icon
					path={iconArrowUpRight}
					size="xs"
				/>
			</Group>
		</Anchor>
	);
}

export function OrganizationOverviewTab({ organization }: OrganizationTabProps) {
	const { setLocation } = useSidebar();
	const showContexts = useHasCloudFeature("create_memory_store");

	const isOrgSupport = hasOrganizationRoles(organization, ORG_ROLES_SUPPORT);
	const isOrgAdmin = hasOrganizationRoles(organization, ORG_ROLES_ADMIN);
	const isOrgOwner = hasOrganizationRoles(organization, ORG_ROLES_OWNER, true);
	const isOrgManagedBilling = isBillingManaged(organization);

	const base = `/o/${organization.id}`;

	const { data: instanceData, isSuccess: instancesLoaded } = useCloudOrganizationInstancesQuery(
		organization.id,
	);

	const { data: contextData, isSuccess: contextsLoaded } = useCloudOrganizationContextsQuery(
		organization.id,
	);

	const instanceCount = instancesLoaded ? instanceData.length : 0;
	const contextCount = contextsLoaded ? contextData.length : 0;

	const manageItems = useMemo(() => {
		const items: ManageItemProps[] = [
			{
				name: "Team",
				description: "Members and roles",
				icon: iconOrganization,
				onClick: () => setLocation(`${base}/team`),
				extra: `${organization.member_count} ${plural(organization.member_count, "member")}`,
			},
		];

		if (isOrgSupport) {
			items.push({
				name: "Support",
				description: "Support plans and requests",
				icon: iconChat,
				onClick: () => setLocation(`${base}/support`),
			});
		}

		if (isOrgOwner && !isOrgManagedBilling) {
			items.push({
				name: "Invoices",
				description: "Past invoices and receipts",
				icon: iconDollar,
				onClick: () => setLocation(`${base}/invoices`),
			});
		}

		if (isOrgOwner) {
			items.push({
				name: "Billing",
				description: "Payment methods and billing",
				icon: iconCreditCard,
				onClick: () => setLocation(`${base}/billing`),
			});
		}

		if (isOrgAdmin) {
			items.push({
				name: "Usage",
				description: "Resource usage and quotas",
				icon: iconProgressClock,
				onClick: () => setLocation(`${base}/usage`),
			});

			items.push({
				name: "Settings",
				description: "Organisation configuration",
				icon: iconCog,
				onClick: () => setLocation(`${base}/settings`),
			});
		}

		return items;
	}, [
		base,
		isOrgOwner,
		isOrgManagedBilling,
		isOrgSupport,
		isOrgAdmin,
		setLocation,
		organization.member_count,
	]);

	const docLinks = useMemo(() => {
		const links: DocLinkProps[] = [
			{
				label: "SurrealDB Cloud documentation",
				href: "https://surrealdb.com/docs/manage/cloud",
			},
			{
				label: "Connecting to your instance",
				href: "https://surrealdb.com/docs/build/deployment/surrealdb-cloud/connecting",
			},
		];

		if (showContexts) {
			links.push({
				label: "Spectron Context documentation",
				href: "https://surrealdb.com/docs/spectron",
			});
		}

		links.push({
			label: "SDK reference",
			href: "https://surrealdb.com/docs",
		});

		return links;
	}, [showContexts]);

	return (
		<>
			<PrimaryTitle fz={32}>{organization.name}</PrimaryTitle>

			<SimpleGrid cols={{ xs: 1, sm: showContexts ? 2 : 1 }}>
				<ResourceCard
					name="Instances"
					subject="instance"
					description="SurrealDB Cloud database instances"
					icon={iconSurreal}
					image={pictoSurrealDBGradient}
					color="violet"
					count={instanceCount}
					onClick={() => setLocation(`${base}/instances`)}
				/>
				{showContexts && (
					<ResourceCard
						name="Contexts"
						subject="context"
						description="Spectron memory and context stores for AI agents"
						icon={iconSpectron}
						image={pictoSpectronGradient}
						color="violet"
						count={contextCount}
						onClick={() => setLocation(`${base}/contexts`)}
						featured
					/>
				)}
			</SimpleGrid>

			<SimpleGrid
				cols={{ xs: 1, md: 2 }}
				mt="xl"
			>
				<Section
					title="Manage"
					description="Organisation administration"
				>
					<Stack gap="xs">
						{manageItems.map((item) => (
							<ManageItem
								key={item.name}
								{...item}
							/>
						))}
					</Stack>
				</Section>

				<Section
					title="Documentation"
					description="Guides and resources"
				>
					<Paper p="lg">
						<Stack>
							{docLinks.map((link, index) => (
								<Fragment key={link.href}>
									<DocLink
										key={link.href}
										{...link}
									/>
									{index < docLinks.length - 1 && <Divider />}
								</Fragment>
							))}
						</Stack>
					</Paper>
				</Section>
			</SimpleGrid>
		</>
	);
}
