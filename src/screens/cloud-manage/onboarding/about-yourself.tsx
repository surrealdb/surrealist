import { Button, Group, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { openModal, closeAllModals } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useInputState } from "@mantine/hooks";
import { Icon } from "~/components/Icon";
import { iconChevronRight } from "~/util/icons";
import { openStartingModal } from "./getting-started";

export function openAboutModal() {
	openModal({
		size: 525,
		title: (
			<PrimaryTitle>Tell us about yourself</PrimaryTitle>
		),
		children: (
			<AboutModal />
		)
	});
}

function AboutModal() {
	const [company, setCompany] = useInputState("");
	const [jobTitle, setJobTitle] = useInputState("");
	const [useCase, setUseCase] = useInputState("");

	return (
		<Stack>
			<Text fz="lg">
				We would love to know more about you and your use case!
			</Text>
			<Group mt="xl">
				<TextInput
					label="Company"
					value={company}
					onChange={setCompany}
					autoFocus
					flex={1}
				/>
				<TextInput
					label="Job title"
					value={jobTitle}
					onChange={setJobTitle}
					flex={1}
				/>
			</Group>
			<Textarea
				label="Use case"
				value={useCase}
				onChange={setUseCase}
				rows={4}
			/>
			<Text
				c="slate"
			>
				This information will help us understand your needs and provide you with the best possible experience.
			</Text>
			<Group mt={75}>
				<Spacer />
				<Button
					variant="gradient"
					rightSection={<Icon path={iconChevronRight} />}
					onClick={() => {
						closeAllModals();
						openStartingModal();
					}}
				>
					Continue
				</Button>
			</Group>
		</Stack>
	);
}