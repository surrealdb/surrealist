import classes from "./style.module.scss";

import { Alert, Box, Button, Group, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchAPI } from "~/cloud/api";
import { AuthGuard } from "~/components/AuthGuard";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { tagEvent } from "~/util/analytics";
import { iconArrowLeft } from "~/util/icons";

export function CreateOrganizationPage() {
	const [, navigate] = useAbsoluteLocation();
	const [name, setName] = useInputState("");

	const { mutateAsync } = useMutation({
		mutationKey: ["create-organization"],
		mutationFn: async () => {
			const result = await fetchAPI<CloudOrganization>("/organizations", {
				method: "POST",
				body: JSON.stringify({ name }),
			});

			tagEvent("cloud_organization_created");

			console.log(result);

			navigate("/overview");
		},
	});

	const handleCreate = useStable(async () => {
		mutateAsync();
	});

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

						<Link to="/overview">
							<Button
								variant="light"
								color="slate"
								size="xs"
								leftSection={<Icon path={iconArrowLeft} />}
							>
								Back to overview
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
						/>

						<Group mt="xl">
							<Link to="/overview">
								<Button
									w={150}
									color="slate"
									variant="light"
									leftSection={<Icon path={iconArrowLeft} />}
								>
									Back to overview
								</Button>
							</Link>
							<Spacer />
							<Button
								w={150}
								type="submit"
								variant="gradient"
								disabled={!name}
								onClick={handleCreate}
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
