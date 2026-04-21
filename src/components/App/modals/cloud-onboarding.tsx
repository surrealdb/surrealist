import {
	Alert,
	Box,
	Button,
	Center,
	Checkbox,
	Container,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { Icon, iconCheck, iconChevronRight, iconErrorCircle, iconSurreal } from "@surrealdb/ui";
import { Fragment, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useImmer } from "use-immer";
import glowUrl from "~/assets/images/glow.png";
import { fetchAPI } from "~/cloud/api";
import {
	Condition,
	Question,
	useCloudFormQuery,
	useCloudTCPPQuery,
} from "~/cloud/queries/onboarding";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useHasCloudSession, useIsCloudEnabled } from "~/hooks/cloud";
import { useCheckbox } from "~/hooks/events";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useAuthentication } from "~/providers/Auth";
import { useCloudStore } from "~/stores/cloud";
import { showErrorNotification } from "~/util/helpers";
import classes from "./cloud-onboarding.module.scss";

type OnboardingStep = "terms" | "about";

const REQUIRED_QUESTIONS = [1, 2];

export function CloudOnboardingModal() {
	const cloudEnabled = useIsCloudEnabled();
	const hasCloudSession = useHasCloudSession();
	const { isAuthenticated } = useAuthentication();
	const onboardingRequired = useCloudStore((s) => s.onboardingRequired);

	const { data: conditionsData, isPending: isLoadingConditions } = useCloudTCPPQuery();
	const { data: questionsData, isPending: isLoadingQuestions } = useCloudFormQuery();

	const conditions = conditionsData ?? [];
	const questions = questionsData ?? [];

	const opened =
		!isLoadingConditions &&
		!isLoadingQuestions &&
		cloudEnabled &&
		isAuthenticated &&
		hasCloudSession &&
		onboardingRequired;

	const [step, setStep] = useState<OnboardingStep>("terms");

	const handleTermsAccepted = async () => {
		setStep("about");
	};

	const handleAboutCompleted = () => {
		useCloudStore.getState().setOnboardingRequired(false);
	};

	return (
		<Modal
			opened={opened}
			onClose={() => {}}
			fullScreen
			padding={0}
			withCloseButton={false}
			closeOnClickOutside={false}
			closeOnEscape={false}
			trapFocus
			lockScroll
			zIndex={1100}
			transitionProps={{
				transition: "fade-up",
				duration: 500,
			}}
			classNames={{
				content: classes.modalContent,
				body: classes.modalBody,
			}}
		>
			<Box className={classes.root}>
				<Center className={classes.formColumn}>
					<Container size="sm">
						{step === "terms" && (
							<TermsStep
								conditions={conditions}
								onAccepted={handleTermsAccepted}
							/>
						)}
						{step === "about" && (
							<AboutStep
								questions={questions}
								onCompleted={handleAboutCompleted}
							/>
						)}
					</Container>
				</Center>

				<Box
					className={classes.brandColumn}
					style={{ "--glow-image": `url(${glowUrl})` }}
					visibleFrom="lg"
				>
					<Box className={classes.brandGlow} />
					<Stack
						align="center"
						gap="xl"
						pos="relative"
					>
						<Icon
							path={iconSurreal}
							className={classes.brandLogo}
							c="bright"
						/>
						<Text
							className={classes.brandTagline}
							fz="xl"
							fw={600}
							c="white"
						>
							The context layer for AI agents. The only vertical stack from storage to
							memory.
						</Text>
					</Stack>
				</Box>
			</Box>
		</Modal>
	);
}

interface TermsStepProps {
	conditions: Condition[];
	onAccepted: () => Promise<void>;
}

function TermsStep({ conditions, onAccepted }: TermsStepProps) {
	const [, navigate] = useAbsoluteLocation();
	const [termsChecked, setTermsChecked] = useState(false);
	const [newsChecked, setNewsChecked] = useState(false);
	const [loading, setLoading] = useState(false);
	const { signOut } = useAuthentication();

	const updateTermsChecked = useCheckbox(setTermsChecked);
	const updateNewsChecked = useCheckbox(setNewsChecked);

	const declineTerms = useStable(() => {
		signOut();
		navigate("/overview");
	});

	const acceptTerms = useStable(async () => {
		setLoading(true);

		try {
			await fetchAPI("/user/terms-accepted", {
				method: "PATCH",
				body: JSON.stringify({
					use: termsChecked,
					marketing: newsChecked,
				}),
			});

			await onAccepted();
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to accept terms",
				content: err.message,
			});
		} finally {
			setLoading(false);
		}
	});

	return (
		<Stack>
			<PrimaryTitle fz={26}>Terms and Conditions</PrimaryTitle>
			<Text
				fz="lg"
				mt="md"
			>
				Please accept our terms and conditions before getting started with SurrealDB Cloud.
			</Text>
			<Checkbox
				mt="xl"
				checked={termsChecked}
				onChange={updateTermsChecked}
				label={
					<>
						<Text span>I have read and agree to the </Text>
						{conditions.map((condition, i) => (
							<Fragment key={condition.url}>
								<Link
									href={condition.url}
									inline
								>
									{condition.name}
								</Link>
								{i < conditions.length - 1 && <Text span>, </Text>}
							</Fragment>
						))}
						.
					</>
				}
			/>
			<Checkbox
				checked={newsChecked}
				onChange={updateNewsChecked}
				label="By subscribing to SurrealDB, you will receive carefully curated content, information on new products and features plus details of educational events where you can engage with our team and community."
			/>
			<Group mt="xl">
				<Button
					variant="light"
					onClick={declineTerms}
				>
					Decline
				</Button>
				<Spacer />
				<Button
					variant="gradient"
					disabled={!termsChecked}
					loading={loading}
					rightSection={<Icon path={iconCheck} />}
					onClick={acceptTerms}
				>
					Accept & continue
				</Button>
			</Group>
		</Stack>
	);
}

interface AboutStepProps {
	questions: Question[];
	onCompleted: () => void;
}

function AboutStep({ questions, onCompleted }: AboutStepProps) {
	const [values, setValues] = useImmer<Record<number, any>>({});

	const submitForm = useStable(() => {
		fetchAPI("/user/form", {
			method: "POST",
			body: JSON.stringify(values),
		});

		onCompleted();
	});

	const isValid = REQUIRED_QUESTIONS.every((id) => values[id]);

	return (
		<>
			<PrimaryTitle fz={26}>Tell us about yourself</PrimaryTitle>
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
				<Stack
					gap="lg"
					mt="md"
				>
					<Text
						fz="lg"
						mb="md"
					>
						We would love to know more about you and your use case!
					</Text>
					{(() => console.log("Q", questions))() ?? null}
					{questions.map((question) => {
						if (question.type === "text") {
							return (
								<TextInput
									key={question.id}
									label={question.question}
									required={REQUIRED_QUESTIONS.includes(question.id)}
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
				<Text fz="sm">
					This information will help us understand your needs
					<br />
					and provide you with the best possible experience.
				</Text>
				<Spacer />
				<Button
					variant="gradient"
					rightSection={<Icon path={iconChevronRight} />}
					onClick={submitForm}
					disabled={!isValid}
					style={{ flexShrink: 0 }}
				>
					Continue
				</Button>
			</Group>
		</>
	);
}
