import {
	Alert,
	Box,
	Button,
	Group,
	Image,
	ScrollArea,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { Icon, iconCheck } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { Redirect } from "wouter";
import { hasOrganizationRoles, ORG_ROLES_OWNER } from "~/cloud/helpers";
import { useCreateContextMutation } from "~/cloud/mutations/spectron";
import { useOrganizationContextPackageQuery } from "~/cloud/queries/contexts";
import {
	useCloudOrganizationQuery,
	useCloudOrganizationsQuery,
} from "~/cloud/queries/organizations";
import { openResourcesLockedModal } from "~/components/App/modals/resources-locked";
import { AuthGuard } from "~/components/AuthGuard";
import { CloudAdminGuard } from "~/components/CloudAdminGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { REGION_FLAGS } from "~/constants";
import { useContextNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudOrganization } from "~/types";
import { ON_FOCUS_SELECT, showErrorNotification } from "~/util/helpers";

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
		<AuthGuard
			loading={organisationsQuery.isLoading || orgDetailPending || packageQueryPending}
		>
			<PageContent organisation={organisation as CloudOrganization} />
		</AuthGuard>
	);
}

interface PageContentProps {
	organisation: CloudOrganization;
}

function PageContent({ organisation }: PageContentProps) {
	const navigateContext = useContextNavigator();
	const allRegions = useCloudStore((s) => s.regions);
	const createContextMutation = useCreateContextMutation(organisation.id);

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

	const regionList = useMemo(
		() =>
			supportedRegions.map((r) => ({
				value: r.slug,
				label: r.description,
			})),
		[supportedRegions],
	);

	const canDeploy = name.trim().length > 0 && name.length <= 30 && region;

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
		<CloudAdminGuard organisation={organisation}>
			<Box
				flex={1}
				pos="relative"
			>
				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					mt={18}
				>
					<Stack
						px="xl"
						mx="auto"
						maw={1200}
						pb={68}
					>
						<Box>
							<PageBreadcrumbs
								items={[
									{ label: "Surrealist", href: "/overview" },
									{
										label: organisation.name,
										href: `/o/${organisation.id}`,
									},
									{
										label: "Contexts",
										href: `/o/${organisation.id}/contexts`,
									},
									{ label: "Create context" },
								]}
							/>
							<PrimaryTitle
								mt="sm"
								fz={32}
							>
								Create context
							</PrimaryTitle>
						</Box>

						<Box my="xl">
							{blockedWithoutPlan && (
								<Alert
									mb="xl"
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
							<SimpleGrid
								spacing={{ base: 36, xl: 64 }}
								cols={{ base: 1, xl: 2 }}
							>
								<Stack gap="lg">
									<PrimaryTitle>Context details</PrimaryTitle>

									<TextInput
										label="Name"
										placeholder="Context name"
										description="Choose carefully, as this name cannot be changed later"
										value={name}
										onChange={(e) => setName(e.currentTarget.value)}
										onFocus={ON_FOCUS_SELECT}
										error={
											name.length > 30
												? "Context name cannot exceed 30 characters"
												: null
										}
									/>

									<Select
										label="Region"
										placeholder="Select a region"
										description="Select the region where your context will be deployed"
										data={regionList}
										value={region}
										onChange={setRegion}
										leftSection={
											region && (
												<Image
													src={REGION_FLAGS[region]}
													w={18}
												/>
											)
										}
										renderOption={(opt) => (
											<Group>
												<Image
													src={REGION_FLAGS[opt.option.value]}
													w={24}
												/>
												{opt.option.label}
												{opt.checked && (
													<Icon
														path={iconCheck}
														c="bright"
													/>
												)}
											</Group>
										)}
									/>
								</Stack>
							</SimpleGrid>

							<Group mt={36}>
								<Button
									variant="gradient"
									disabled={!canDeploy || blockedWithoutPlan}
									loading={isDeploying}
									onClick={handleDeploy}
								>
									Create context
								</Button>
							</Group>
						</Box>
					</Stack>
				</ScrollArea>
			</Box>
		</CloudAdminGuard>
	);
}
