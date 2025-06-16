import { Box, Checkbox, Collapse, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { DeploySectionProps } from "../types";
import { useStable } from "~/hooks/stable";

export function SetupSection({ details, setDetails }: DeploySectionProps) {
	const toggleDataset = useStable(() => {
		setDetails((draft) => {
			draft.dataset = !draft.dataset;
		});
	});

	const toggleCredentials = useStable(() => {
		setDetails((draft) => {
			draft.credentials = !draft.credentials;
		});
	});

	return (
		<Box
			mt={52}
			maw={650}
		>
			<PrimaryTitle fz={22}>Deploy options</PrimaryTitle>

			<Stack
				gap="xl"
				mt="md"
			>
				<Checkbox
					label="Initialize with a sample dataset"
					checked={details.dataset}
					onChange={toggleDataset}
				/>
				<Box>
					<Checkbox
						label="Configure root credentials"
						checked={details.credentials}
						onChange={toggleCredentials}
					/>
					<Collapse in={details.credentials}>
						<SimpleGrid
							cols={2}
							mt="md"
						>
							<TextInput
								label="Username"
								placeholder="root"
								value={details.username}
								onChange={(e) =>
									setDetails((draft) => {
										draft.username = e.currentTarget.value;
									})
								}
							/>
							<TextInput
								label="Password"
								placeholder="password"
								type="password"
								value={details.password}
								onChange={(e) =>
									setDetails((draft) => {
										draft.password = e.currentTarget.value;
									})
								}
							/>
						</SimpleGrid>
					</Collapse>
				</Box>
			</Stack>
		</Box>
	);
}
