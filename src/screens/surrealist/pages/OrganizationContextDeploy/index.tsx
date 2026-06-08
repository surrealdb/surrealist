import {
	Alert,
	Box,
	Button,
	Group,
	Image,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Title,
} from "@mantine/core";
import {
	Icon,
	iconArrowUpRight,
	iconAuth,
	iconCloudClock,
	iconRelation,
	iconServerSecure,
	pictoSpectron,
	SectionTitle,
} from "@surrealdb/ui";
import { useId, useState } from "react";
import { Redirect } from "wouter";
import { hasOrganizationRoles, ORG_ROLES_OWNER } from "~/cloud/helpers";
import { useCreateContextMutation } from "~/cloud/mutations/spectron";
import { useOrganizationContextPackageQuery } from "~/cloud/queries/contexts";
import {
	useCloudOrganizationQuery,
	useCloudOrganizationsQuery,
} from "~/cloud/queries/organizations";
import { openResourcesLockedModal } from "~/components/App/modals/resources-locked";
import { CloudAdminGuard } from "~/components/CloudAdminGuard";
import { CloudGuard } from "~/components/CloudGuard";
import { Label } from "~/components/Label";
import { Option } from "~/components/Option";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { Spacer } from "~/components/Spacer";
import { REGION_FLAGS } from "~/constants";
import { useAbsoluteLocation, useContextNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudOrganization } from "~/types";
import { orgSectionBreadcrumbs } from "~/util/breadcrumbs";
import { ON_FOCUS_SELECT, showErrorNotification } from "~/util/helpers";
import { PageContainer } from "../../components/PageContainer";
import classes from "./style.module.scss";

const SPECTRON_HIGHLIGHTS: { label: string; description: string; icon: string }[] = [
	{
		label: "ACID memory",
		description: "Atomic writes across entities, facts, and embeddings.",
		icon: iconServerSecure,
	},
	{
		label: "Temporal facts",
		description: "Bi-temporal history — know what was true and when.",
		icon: iconCloudClock,
	},
	{
		label: "Hybrid retrieval",
		description: "Graph, vectors, and filters in a single query.",
		icon: iconRelation,
	},
	{
		label: "Multi-agent",
		description: "Shared memory for coordinated agent swarms.",
		icon: iconAuth,
	},
];

export interface OrganizationContextDeployPageProps {
	id: string;
}

export function OrganizationContextDeployPage({ id }: OrganizationContextDeployPageProps) {
	const organisationsQuery = useCloudOrganizationsQuery();
	const { data: organisation, isPending: orgDetailPending } = useCloudOrganizationQuery(id);
	const { isPending: packageQueryPending } = useOrganizationContextPackageQuery(id);

	if (organisationsQuery.isSuccess && !organisation) {
		return <Redirect to="/" />;
	}

	return (
		<CloudGuard
			loading={organisationsQuery.isLoading || orgDetailPending || packageQueryPending}
		>
			<PageContent organisation={organisation as CloudOrganization} />
		</CloudGuard>
	);
}

interface PageContentProps {
	organisation: CloudOrganization;
}

function PageContent({ organisation }: PageContentProps) {
	const regionGroupLabelId = useId();
	const navigateContext = useContextNavigator();
	const allRegions = useCloudStore((s) => s.contextRegions);
	const createContextMutation = useCreateContextMutation(organisation.id);
	const [, navigate] = useAbsoluteLocation();

	const isOrgOwner = hasOrganizationRoles(organisation, ORG_ROLES_OWNER, true);

	const [name, setName] = useState("");
	const [region, setRegion] = useState<string | null>(null);
	const [isDeploying, setIsDeploying] = useState(false);

	const { data: orgPackages, isSuccess: orgPackageQuerySuccess } =
		useOrganizationContextPackageQuery(organisation.id);

	const activeOrgPackage = orgPackages?.find((p) => !p.disabled_at);
	const hasOrgPackage = orgPackageQuerySuccess && !!activeOrgPackage;

	const blockedWithoutPlan = orgPackageQuerySuccess && !hasOrgPackage && !isOrgOwner;

	const regionSet = new Set(organisation?.plan.regions ?? []);
	const supportedRegions = allRegions.filter((r) => regionSet.has(r.slug));

	const canDeploy =
		name.trim().length > 0 &&
		name.length <= 30 &&
		region &&
		supportedRegions.some((r) => r.slug === region);

	const handleDeploy = useStable(async () => {
		if (!canDeploy || !region || isDeploying || blockedWithoutPlan) return;

		if (organisation.resources_locked) {
			openResourcesLockedModal(organisation);
			return;
		}

		setIsDeploying(true);

		try {
			const result = await createContextMutation.mutateAsync({
				name: name.trim(),
				region,
			});

			navigateContext(organisation.id, result.id);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);

			showErrorNotification({
				title: "Failed to create context",
				content: message,
			});
		} finally {
			setIsDeploying(false);
		}
	});

	if (orgPackageQuerySuccess && !hasOrgPackage && isOrgOwner) {
		const redirect = encodeURIComponent(`/o/${organisation.id}/contexts/deploy`);

		return <Redirect to={`/o/${organisation.id}/contexts/plan?redirect=${redirect}`} />;
	}

	return (
		<>
			<PageBreadcrumbs
				items={orgSectionBreadcrumbs(organisation, "contexts", { label: "Create" })}
			/>
			<CloudAdminGuard organisation={organisation}>
				<PageContainer>
					<Paper
						p="xl"
						radius="lg"
						variant="glass"
						className={classes.hero}
					>
						<Image
							src={pictoSpectron}
							className={classes.heroArt}
							alt=""
							aria-hidden
						/>
						<Box maw={650}>
							<Title
								fz={{ base: 28, sm: 36 }}
								variant="gradient"
							>
								Create a context
							</Title>
							<Text
								mt="md"
								fz="lg"
								lh={1.55}
								className="selectable"
							>
								A context is a dedicated Spectron environment: ingest conversations
								and documents, extract structure, and retrieve with hybrid search.
								Choose a suitable name and the region where memory will reside to
								get started.
							</Text>
						</Box>
						<Group
							mt="xl"
							gap="sm"
						>
							<Button
								component="a"
								href="https://surrealdb.com/platform/spectron"
								target="_blank"
								rel="noopener noreferrer"
								color="slate"
								rightSection={<Icon path={iconArrowUpRight} />}
							>
								What is Spectron?
							</Button>
							<Button
								component="a"
								href="https://surrealdb.com/docs/build/spectron"
								target="_blank"
								rel="noopener noreferrer"
								variant="subtle"
								color="slate"
								rightSection={<Icon path={iconArrowUpRight} />}
							>
								Documentation
							</Button>
						</Group>
					</Paper>

					<SimpleGrid
						mt="xl"
						spacing={48}
						cols={{ base: 1, md: 2 }}
					>
						<Paper
							p="xl"
							radius="md"
						>
							<Stack gap="xl">
								<SectionTitle
									kicker="Configuration"
									order={2}
								>
									Build your context
								</SectionTitle>

								{blockedWithoutPlan && (
									<Alert
										color="orange"
										title="Spectron plan required"
									>
										<Text className="selectable">
											This organisation does not have an active Spectron plan.
											Only the organisation owner can subscribe to a plan.
											Contact your organisation owner to continue.
										</Text>
									</Alert>
								)}

								<TextInput
									label="Name"
									placeholder="e.g. Production context"
									value={name}
									onChange={(e) => setName(e.currentTarget.value)}
									onFocus={ON_FOCUS_SELECT}
									autoFocus
									disabled={blockedWithoutPlan}
									error={
										name.length > 30
											? "Context name cannot exceed 30 characters"
											: null
									}
								/>

								<Box>
									<Label id={regionGroupLabelId}>Region</Label>
									<Box
										role="radiogroup"
										aria-labelledby={regionGroupLabelId}
									>
										<SimpleGrid
											cols={{ base: 1, xs: 2, md: 1, lg: 2 }}
											spacing="md"
										>
											{supportedRegions.map((r) => {
												const selected = region === r.slug;

												return (
													<Option
														key={r.slug}
														label={r.description}
														checked={selected}
														disabled={blockedWithoutPlan}
														onChange={() => setRegion(r.slug)}
														withBorder
														py="md"
														icon={
															<Image
																src={REGION_FLAGS[r.slug]}
																w={18}
															/>
														}
													/>
												);
											})}
										</SimpleGrid>
									</Box>
								</Box>

								<Group>
									<Button
										onClick={() => navigate(`/o/${organisation.id}/contexts`)}
									>
										Back
									</Button>
									<Spacer />
									<Button
										variant="gradient"
										disabled={!canDeploy || blockedWithoutPlan}
										loading={isDeploying}
										onClick={handleDeploy}
									>
										Create context
									</Button>
								</Group>
							</Stack>
						</Paper>
						<Stack
							gap="lg"
							visibleFrom="md"
						>
							<Box>
								<SectionTitle
									kicker="What you get"
									order={2}
								>
									Agent memory that actually works
								</SectionTitle>
								<Text
									mt="sm"
									fz="sm"
									lh={1.6}
									className="selectable"
								>
									Each context is provisioned with SurrealDB&apos;s Spectron
									pipeline - the same model described in your context dashboard
									after deployment.
								</Text>
							</Box>
							<SimpleGrid
								cols={{ base: 1, sm: 2 }}
								spacing="sm"
							>
								{SPECTRON_HIGHLIGHTS.map((item) => (
									<Paper
										key={item.label}
										p="md"
									>
										<Group
											gap="sm"
											wrap="nowrap"
											align="flex-start"
										>
											<ThemeIcon
												size={34}
												radius="md"
												variant="light"
												color="violet"
											>
												<Icon path={item.icon} />
											</ThemeIcon>
											<Box miw={0}>
												<Text
													fw={600}
													c="bright"
												>
													{item.label}
												</Text>
												<Text
													fz="sm"
													lh={1.45}
													mt={2}
													className="selectable"
												>
													{item.description}
												</Text>
											</Box>
										</Group>
									</Paper>
								))}
							</SimpleGrid>
						</Stack>
					</SimpleGrid>
				</PageContainer>
			</CloudAdminGuard>
		</>
	);
}
