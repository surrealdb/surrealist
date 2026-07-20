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
	getCDNImageURL,
	Icon,
	iconArrowUpRight,
	iconAuth,
	iconCloudClock,
	iconRelation,
	iconServerSecure,
	pictoSpectronGradient,
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
import { useAbsoluteLocation, useContextNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudOrganization } from "~/types";
import { orgSectionBreadcrumbs } from "~/util/breadcrumbs";
import { ON_FOCUS_SELECT, showErrorNotification } from "~/util/helpers";
import { PageContainer } from "../../components/PageContainer";
import classes from "./style.module.scss";

// Business-outcome framing (draft for PM review, #748): each card speaks to a
// user benefit rather than the underlying engine mechanic.
const SPECTRON_HIGHLIGHTS: { label: string; description: string; icon: string }[] = [
	{
		label: "Answers you can trust",
		description: "Every answer is grounded in stored facts you can trace back to their source.",
		icon: iconRelation,
	},
	{
		label: "Always up to date",
		description:
			"Knows what's true now versus what was true before, so stale facts don't resurface.",
		icon: iconCloudClock,
	},
	{
		label: "Access on your terms",
		description: "Decide exactly which memories each user and agent is allowed to see.",
		icon: iconAuth,
	},
	{
		label: "Your data stays yours",
		description:
			"Memory lives in an isolated context you control — never shared, never trained on.",
		icon: iconServerSecure,
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
		return <Redirect to="/overview" />;
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

	const {
		data: orgPackages,
		isSuccess: orgPackageQuerySuccess,
		isFetching: orgPackagesFetching,
	} = useOrganizationContextPackageQuery(organisation.id);

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

	if (orgPackageQuerySuccess && !hasOrgPackage && isOrgOwner && !orgPackagesFetching) {
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
						className={classes.hero}
					>
						<Image
							src={pictoSpectronGradient}
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
								A context is your agent's private memory layer — it remembers what
								matters from every conversation and document, keeps it current, and
								serves it back with sources you can trust. Name it and choose a
								region to get started.
							</Text>
						</Box>
						<Group
							mt="xl"
							gap="sm"
						>
							<Button
								component="a"
								href="https://surrealdb.com/docs/spectron"
								target="_blank"
								rel="noopener noreferrer"
								color="slate"
								rightSection={<Icon path={iconArrowUpRight} />}
							>
								What is Spectron?
							</Button>
							<Button
								component="a"
								href="https://surrealdb.com/docs/spectron"
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

					<Paper
						mt="xl"
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
										Only the organisation owner can subscribe to a plan. Contact
										your organisation owner to continue.
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
															src={getCDNImageURL(r.flag)}
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
								<Button onClick={() => navigate(`/o/${organisation.id}/contexts`)}>
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

					<Box mt="xl">
						<SectionTitle
							kicker="What you get"
							order={2}
						>
							Why teams build on Spectron
						</SectionTitle>
						<SimpleGrid
							mt="lg"
							cols={{ base: 1, sm: 2, lg: 4 }}
							spacing="md"
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
					</Box>
				</PageContainer>
			</CloudAdminGuard>
		</>
	);
}
