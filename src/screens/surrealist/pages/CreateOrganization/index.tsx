import classes from "./style.module.scss";

import { Box, Button, Group, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchAPI } from "~/cloud/api";
import { AuthGuard } from "~/components/AuthGuard";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useLastSavepoint } from "~/hooks/overview";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { tagEvent } from "~/util/analytics";
import { iconArrowLeft } from "~/util/icons";

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

			tagEvent("cloud_organization_created");

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
				<TopGlow offset={200} />

				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					className={classes.scrollArea}
					viewportProps={{
						style: { paddingBlock: 75 },
					}}
				>
					<Stack
						mx="auto"
						maw={650}
						gap="xl"
					>
						<Box>
							<PrimaryTitle fz={26}>New organization</PrimaryTitle>
							<Text fz="xl">Create a space to manage your team</Text>
						</Box>

						<Link to={savepoint.path}>
							<Button
								variant="light"
								color="slate"
								size="xs"
								leftSection={<Icon path={iconArrowLeft} />}
							>
								Back to {savepoint.name}
							</Button>
						</Link>

						<Box mt="xl">
							<Text
								fz="xl"
								fw={600}
								c="bright"
							>
								Name
							</Text>
							<Text>Specify the name of your organization</Text>
						</Box>

						<TextInput
							placeholder="My organization"
							value={name}
							onChange={setName}
							error={
								name.length > 30
									? "Organization name cannot exceed 30 characters"
									: null
							}
							autoFocus
						/>

						<Group mt="xl">
							<Link to={savepoint.path}>
								<Button
									color="slate"
									variant="light"
								>
									Cancel
								</Button>
							</Link>
							<Spacer />
							<Button
								w={150}
								type="submit"
								variant="gradient"
								disabled={name.length === 0 || name.length > 30}
								onClick={handleCreate}
								loading={isPending}
							>
								Create organization
							</Button>
						</Group>
					</Stack>
				</ScrollArea>
			</Box>
		</AuthGuard>
	);
}
