import { Button, Group, Stack, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon, iconOrganization, SectionTitle } from "@surrealdb/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchAPI } from "~/cloud/api";
import { CloudGuard } from "~/components/CloudGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { tagEvent } from "~/util/analytics";
import { PageContainer } from "../../components/PageContainer";

export function CreateOrganizationPage() {
	const [, navigate] = useAbsoluteLocation();
	const [name, setName] = useInputState("");
	const client = useQueryClient();

	const { mutateAsync, isPending } = useMutation({
		mutationKey: ["create-organization"],
		mutationFn: async () => {
			const organization = await fetchAPI<CloudOrganization>("/organizations", {
				method: "POST",
				body: JSON.stringify({ name }),
			});

			await tagEvent("cloud_organisation_created", {
				organisation: organization.id,
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});

			navigate(`/o/${organization.id}`);
		},
	});

	const handleCreate = useStable(async () => {
		mutateAsync();
	});

	return (
		<>
			<PageBreadcrumbs items={[{ label: "Create organisation" }]} />
			<CloudGuard>
				<PageContainer>
					<SectionTitle>Create organisation</SectionTitle>

					<Stack
						mt="xl"
						maw={350}
					>
						<TextInput
							autoFocus
							label="Name"
							description="Specify the name of your organisation"
							placeholder="My organisation"
							value={name}
							onChange={setName}
							leftSection={
								<Icon
									c="violet"
									path={iconOrganization}
								/>
							}
							error={
								name.length > 30
									? "Organisation name cannot exceed 30 characters"
									: null
							}
						/>
					</Stack>

					<Group mt="xl">
						<Link to="/overview">
							<Button
								color="obsidian"
								variant="light"
							>
								Back
							</Button>
						</Link>
						<Button
							type="submit"
							variant="gradient"
							disabled={name.length === 0 || name.length > 30}
							onClick={handleCreate}
							loading={isPending}
						>
							Create organisation
						</Button>
					</Group>
				</PageContainer>
			</CloudGuard>
		</>
	);
}
