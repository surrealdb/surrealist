import { Alert, Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { openModal, closeAllModals } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { Icon } from "~/components/Icon";
import { iconChevronRight, iconErrorCircle } from "~/util/icons";
import { openStartingModal } from "./getting-started";
import { useImmer } from "use-immer";
import { ErrorBoundary } from "react-error-boundary";
import { useStable } from "~/hooks/stable";
import { fetchAPI } from "../api";

export type Question = {
	data: { min_length?: number, max_length?: number };
	id: string;
	question: string;
	type: "text";
} | {
	data: { options: { order: number, text: string, value: string }[] };
	id: string;
	question: string;
	type: "option";
}

export function openAboutModal(questions: Question[]) {
	openModal({
		size: 525,
		title: (
			<PrimaryTitle>Tell us about yourself</PrimaryTitle>
		),
		children: (
			<AboutModal
				questions={questions}
			/>
		)
	});
}

interface AboutModalProps {
	questions: Question[];
}

function AboutModal({
	questions
}: AboutModalProps) {
	const [values, setValues] = useImmer<Record<string, any>>({});

	const submitForm = useStable(() => {
		fetchAPI("/user/form", {
			method: "POST",
			body: JSON.stringify(values)
		});

		closeAllModals();
		openStartingModal();
	});

	return (
		<>
			<ErrorBoundary
				fallback={
					<Alert
						color="red.5"
						icon={<Icon path={iconErrorCircle} />}
					>
						An error occurred while rendering this form. Please continue to the next step.
					</Alert>
				}
			>
				<Stack>
					<Text fz="lg">
						We would love to know more about you and your use case!
					</Text>
					{questions.map((question) => {
						if (question.type === "text") {
							return (
								<TextInput
									key={question.id}
									label={question.question}
									value={values[question.id] || ""}
									onChange={(value) => setValues((draft) => {
										draft[question.id] = value.target.value;
									})}
								/>
							);
						} else if (question.type === "option") {
							const options = question.data.options
								.sort((a, b) => a.order - b.order)
								.map((option) => ({
									label: option.text,
									value: option.value
								}));

							return (
								<Select
									key={question.id}
									label={question.question}
									data={options}
									value={values[question.id] || null}
									onChange={(value) => setValues((draft) => {
										draft[question.id] = value;
									})}
								/>
							);
						}
					})}
					<Text
						c="slate"
					>
						This information will help us understand your needs and provide you with the best possible experience.
					</Text>
				</Stack>
			</ErrorBoundary>

			<Group mt="xl">
				<Spacer />
				<Button
					variant="gradient"
					rightSection={<Icon path={iconChevronRight} />}
					onClick={submitForm}
				>
					Continue
				</Button>
			</Group>
		</>
	);
}