import {
	Alert,
	Box,
	Button,
	Center,
	Checkbox,
	Container,
	Group,
	Loader,
	Select,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
} from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import {
	Icon,
	iconCheck,
	iconChevronRight,
	iconEmail,
	iconErrorCircle,
	iconSurreal,
} from "@surrealdb/ui";
import { Fragment, useEffect, useState } from "react";
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
import { useCheckbox } from "~/hooks/events";
import { useStable } from "~/hooks/stable";
import { useAuthentication } from "~/providers/Auth";
import { useCloud } from "~/providers/Cloud";
import { useCloudStore } from "~/stores/cloud";
import { showErrorNotification } from "~/util/helpers";
import classes from "./cloud-onboarding.module.scss";

export const CLOUD_ONBOARDING_MODAL_ID = "cloud-onboarding";

/** Must exceed the onboarding modal z-index so Select dropdowns are visible. */
const ONBOARDING_COMBOBOX_Z_INDEX = 1200;

type OnboardingStep = "verify" | "terms" | "about";

/**
 * Opens the cloud onboarding flow when the user must verify their email or accept terms.
 */
export function openCloudOnboardingModal() {
	openModal({
		modalId: CLOUD_ONBOARDING_MODAL_ID,
		fullScreen: true,
		padding: 0,
		withCloseButton: false,
		closeOnClickOutside: false,
		closeOnEscape: false,
		trapFocus: true,
		lockScroll: true,
		zIndex: 1100,
		transitionProps: {
			transition: "fade-up",
			duration: 500,
		},
		classNames: {
			content: classes.modalContent,
			body: classes.modalBody,
		},
		children: <CloudOnboardingModalInner />,
	});
}

function CloudOnboardingModalInner() {
	const { isActive: hasCloudSession } = useCloud();
	const { isAuthenticated, user, signOut } = useAuthentication();
	const termsAcceptancePending = useCloudStore((s) => s.termsAcceptancePending);

	const { data: conditionsData, isPending: isLoadingConditions } = useCloudTCPPQuery();
	const { data: questionsData, isPending: isLoadingQuestions } = useCloudFormQuery();

	const conditions = conditionsData ?? [];
	const questions = questionsData ?? [];

	const needsVerify = isAuthenticated && user?.email_verified === false;

	const [step, setStep] = useState<OnboardingStep>("verify");

	useEffect(() => {
		if (needsVerify) {
			setStep("verify");
			return;
		}

		if (termsAcceptancePending && hasCloudSession) {
			setStep("terms");
			return;
		}

		if (hasCloudSession) {
			setStep("about");
		}
	}, [needsVerify, termsAcceptancePending, hasCloudSession]);

	useEffect(() => {
		if (step !== "about") {
			return;
		}

		if (isLoadingQuestions) {
			return;
		}

		if (questions.length > 0) {
			return;
		}

		closeModal(CLOUD_ONBOARDING_MODAL_ID);
	}, [step, isLoadingQuestions, questions.length]);

	const handleQuit = useStable(async () => {
		await signOut();
		closeModal(CLOUD_ONBOARDING_MODAL_ID);
	});

	const handleTermsAccepted = async () => {
		setStep("about");
	};

	const handleAboutCompleted = () => {
		closeModal(CLOUD_ONBOARDING_MODAL_ID);
	};

	const showTermsLoader = step === "terms" && isLoadingConditions;
	const showAboutLoader = step === "about" && isLoadingQuestions;

	return (
		<Box className={classes.root}>
			<Center className={classes.formColumn}>
				<Container size="sm">
					{showTermsLoader || showAboutLoader ? (
						<Center py="xl">
							<Loader size="lg" />
						</Center>
					) : (
						<>
							{step === "verify" && <VerifyStep onQuit={handleQuit} />}
							{step === "terms" && (
								<TermsStep
									onQuit={handleQuit}
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
						</>
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
	);
}

function VerifyStep({ onQuit }: { onQuit: () => void | Promise<void> }) {
	const { getAccessToken, user } = useAuthentication();
	const [loading, setLoading] = useState(false);

	const handleRefresh = useStable(async () => {
		setLoading(true);

		try {
			await getAccessToken({ cacheMode: "off" });

			if (user?.email_verified !== true) {
				showNotification({
					color: "blue",
					title: "Email not yet verified",
					message: "Please verify your email and try again.",
				});
			}
		} catch {
			showErrorNotification({
				title: "Could not refresh verification status",
				content: "Please try again in a moment.",
			});
		} finally {
			setLoading(false);
		}
	});

	return (
		<Stack>
			<Group>
				<ThemeIcon size="lg">
					<Icon
						path={iconEmail}
						size="lg"
					/>
				</ThemeIcon>
				<PrimaryTitle fz={26}>Verify your email</PrimaryTitle>
			</Group>
			<Text
				fz="lg"
				mt="md"
			>
				Please verify your email before continuing. If you have not received an email,
				please check your spam folder.
			</Text>
			<Group mt="xl">
				<Button
					variant="light"
					onClick={() => void onQuit()}
				>
					Exit
				</Button>
				<Spacer />
				<Button
					variant="gradient"
					loading={loading}
					rightSection={<Icon path={iconEmail} />}
					onClick={handleRefresh}
				>
					I've verified my email
				</Button>
			</Group>
		</Stack>
	);
}

interface TermsStepProps {
	conditions: Condition[];
	onAccepted: () => Promise<void>;
	onQuit: () => void | Promise<void>;
}

function TermsStep({ conditions, onAccepted, onQuit }: TermsStepProps) {
	const [termsChecked, setTermsChecked] = useState(false);
	const [newsChecked, setNewsChecked] = useState(false);
	const [loading, setLoading] = useState(false);

	const updateTermsChecked = useCheckbox(setTermsChecked);
	const updateNewsChecked = useCheckbox(setNewsChecked);

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

			useCloudStore.getState().setTermsAcceptancePending(false);
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
					onClick={() => void onQuit()}
				>
					Quit
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
	const [values, setValues] = useImmer<Record<number, unknown>>({});

	const submitForm = useStable(() => {
		onCompleted();
	});

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
					{questions.map((question) => {
						if (question.type === "text") {
							return (
								<TextInput
									key={question.id}
									label={question.question}
									required
									value={(values[question.id] as string) || ""}
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
									placeholder="Select an option"
									data={options}
									value={(values[question.id] as string) || null}
									comboboxProps={{ zIndex: ONBOARDING_COMBOBOX_Z_INDEX }}
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
					style={{ flexShrink: 0 }}
				>
					Continue
				</Button>
			</Group>
		</>
	);
}
