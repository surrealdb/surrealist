import glowUrl from "~/assets/images/gradient-glow.webp";
import classes from "../style.module.scss";

import { Alert, Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { ErrorBoundary } from "react-error-boundary";
import { useImmer } from "use-immer";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { getIsLight } from "~/hooks/theme";
import { iconChevronRight, iconErrorCircle } from "~/util/icons";
import { fetchAPI } from "../api";
import { openStartingModal } from "./getting-started";

export type Question =
	| {
			data: { min_length?: number; max_length?: number };
			id: string;
			question: string;
			type: "text";
	  }
	| {
			data: { options: { order: number; text: string; value: string }[] };
			id: string;
			question: string;
			type: "option";
	  };

export function openAboutModal(questions: Question[]) {
	openModal({
		size: 525,
		closeOnEscape: false,
		closeOnClickOutside: false,
		title: <PrimaryTitle>Tell us about yourself</PrimaryTitle>,
		children: <AboutModal questions={questions} />,
		classNames: {
			content: classes.onboardingDialog,
		},
		styles: {
			root: {
				"--image": `url(${glowUrl})`,
			},
		},
	});
}

interface AboutModalProps {
	questions: Question[];
}

function AboutModal({ questions }: AboutModalProps) {
	const [values, setValues] = useImmer<Record<string, any>>({});

	const submitForm = useStable(() => {
		fetchAPI("/user/form", {
			method: "POST",
			body: JSON.stringify(values),
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
						An error occurred while rendering this form. Please continue to the next
						step.
					</Alert>
				}
			>
				<Stack gap="lg">
					<Text
						fz="lg"
						mb="md"
					>
						We would love to know more about you and your use case!
					</Text>
					{questions.map((question) => {
						if (question.type === "text") {
							return (
								<TextInput
									key={question.id}
									label={question.question}
									value={values[question.id] || ""}
									onChange={(value) =>
										setValues((draft) => {
											draft[question.id] = value.target.value;
										})
									}
								/>
							);
						}

						if (question.type === "option") {
							const options = question.data.options
								.sort((a, b) => a.order - b.order)
								.map((option) => ({
									label: option.text,
									value: option.value,
								}));

							return (
								<Select
									key={question.id}
									label={question.question}
									data={options}
									value={values[question.id] || null}
									onChange={(value) =>
										setValues((draft) => {
											draft[question.id] = value;
										})
									}
								/>
							);
						}
					})}
				</Stack>
			</ErrorBoundary>

			<Group
				mt="xl"
				wrap="nowrap"
			>
				<Text
					c="slate"
					fz="sm"
				>
					This information will help us understand your needs
					<br />
					and provide you with the best possible experience.
				</Text>
				<Spacer />
				<Button
					variant="gradient"
					rightSection={<Icon path={iconChevronRight} />}
					onClick={submitForm}
					style={{ flexShrink: 0 }}
				>
					Continue
				</Button>
			</Group>
		</>
	);
}
