import classes from "./style.module.scss";

import { Box, Button, Group, ScrollArea, Stack, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchAPI } from "~/cloud/api";
import { AuthGuard } from "~/components/AuthGuard";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useLastSavepoint } from "~/hooks/overview";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { tagEvent } from "~/util/analytics";
import { iconOrganization } from "~/util/icons";

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

			tagEvent("cloud_organisation_created", {
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

	const savepoint = useLastSavepoint();

	return (
		<AuthGuard>
			<Box
				flex={1}
				pos="relative"
			>
				<TopGlow offset={250} />

				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					className={classes.scrollArea}
					mt={86}
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
									{ label: "Organisations", href: "/organisations" },
									{ label: "Create" },
								]}
							/>
							<PrimaryTitle
								fz={32}
								mt="sm"
							>
								Embed Surrealist
							</PrimaryTitle>
						</Box>

						<Stack
							mt={36}
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
										c="surreal"
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

						<Group mt={24}>
							<Link to={savepoint.path}>
								<Button
									color="slate"
									variant="light"
								>
									Back
								</Button>
							</Link>
							<Button
								w={150}
								type="submit"
								variant="gradient"
								disabled={name.length === 0 || name.length > 30}
								onClick={handleCreate}
								loading={isPending}
							>
								Create organisation
							</Button>
						</Group>
					</Stack>
				</ScrollArea>
			</Box>
		</AuthGuard>
	);
}
