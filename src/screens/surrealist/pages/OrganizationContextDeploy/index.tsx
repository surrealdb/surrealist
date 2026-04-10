import {
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
import { Icon, iconCheck, iconChevronRight } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { Redirect } from "wouter";
import { useCreateContextMutation } from "~/cloud/mutations/spectron";
import {
	useCloudOrganizationQuery,
	useCloudOrganizationsQuery,
} from "~/cloud/queries/organizations";
import { AuthGuard } from "~/components/AuthGuard";
import { CloudAdminGuard } from "~/components/CloudAdminGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { REGION_FLAGS } from "~/constants";
import { useContextNavigator } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import type { CloudOrganization } from "~/types";
import { ON_FOCUS_SELECT } from "~/util/helpers";

export interface OrganizationContextDeployPageProps {
	id: string;
}

export function OrganizationContextDeployPage({ id }: OrganizationContextDeployPageProps) {
	const organisationsQuery = useCloudOrganizationsQuery();
	const { data: organisation } = useCloudOrganizationQuery(id);

	if (organisationsQuery.isSuccess && !organisation) {
		return <Redirect to="/overview" />;
	}

	return (
		<AuthGuard loading={organisationsQuery.isLoading}>
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

	const [name, setName] = useState("");
	const [region, setRegion] = useState<string | null>(null);
	const [isDeploying, setIsDeploying] = useState(false);

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

	const handleDeploy = async () => {
		if (!canDeploy || isDeploying) return;

		setIsDeploying(true);

		try {
			const result = await createContextMutation.mutateAsync({
				name: name.trim(),
				region: region,
			});

			navigateContext(result.id);
		} finally {
			setIsDeploying(false);
		}
	};

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
							<Text mt="xs">
								Configure and deploy a new Spectron context in this organisation.
							</Text>
						</Box>

						<Box my="xl">
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
									disabled={!canDeploy}
									loading={isDeploying}
									onClick={handleDeploy}
									rightSection={<Icon path={iconChevronRight} />}
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
