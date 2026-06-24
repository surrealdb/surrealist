import {
	Anchor,
	Box,
	Button,
	Divider,
	Group,
	Image,
	List,
	Modal,
	Paper,
	Stack,
	Text,
} from "@mantine/core";
import { Icon, iconCheck, iconChevronRight, iconClose, iconOpen, Spacer } from "@surrealdb/ui";
import type { PropsWithChildren, ReactNode } from "react";
import { useEffect } from "react";
import { Link } from "wouter";
import instanceBanner from "~/assets/images/instance.webp";
import sandboxBanner from "~/assets/images/sandbox.webp";
import spectronBanner from "~/assets/images/spectron.webp";
import { ActionButton } from "~/components/ActionButton";
import { useBoolean } from "~/hooks/boolean";
import { useOnboarding } from "~/hooks/onboarding";

interface OnboardingAction {
	label: string;
	href?: string;
}

interface OnboardingModalProps {
	onboardingKey: string;
	enabled: boolean;
	title: string;
	subtitle?: string;
	description: string;
	learnMoreHref?: string;
	deployAction?: OnboardingAction;
	media?: ReactNode;
}

function OnboardingModal({
	onboardingKey,
	enabled,
	title,
	subtitle,
	description,
	learnMoreHref,
	deployAction,
	media,
	children,
}: PropsWithChildren<OnboardingModalProps>) {
	const [isOpen, openHandle] = useBoolean();
	const [completed, complete] = useOnboarding(onboardingKey);

	useEffect(() => {
		if (enabled && !completed) {
			openHandle.open();
			complete();
		}
	}, [enabled, completed]);

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			trapFocus={false}
			padding={0}
			size={525}
		>
			<ActionButton
				pos="absolute"
				top={16}
				right={16}
				label="Close"
				onClick={openHandle.close}
				style={{ zIndex: 1 }}
			>
				<Icon path={iconClose} />
			</ActionButton>

			{media && (
				<>
					{media}

					<Divider />
				</>
			)}

			<Paper
				p={24}
				withBorder={false}
				radius={0}
			>
				<Stack gap="xl">
					<Box>
						<Text
							c="bright"
							fw={600}
							fz="h2"
						>
							{title}
						</Text>

						{subtitle && <Text fz="lg">{subtitle}</Text>}
					</Box>

					<Text>{description}</Text>

					{children && (
						<List
							size="sm"
							c="bright"
							spacing="md"
							icon={
								<Icon
									path={iconCheck}
									c="violet"
								/>
							}
						>
							{children}
						</List>
					)}

					<Group>
						{learnMoreHref && (
							<Anchor href={learnMoreHref}>
								<Button
									color="obsidian"
									variant="light"
									rightSection={<Icon path={iconOpen} />}
								>
									Learn more
								</Button>
							</Anchor>
						)}
						<Spacer />
						{deployAction &&
							(deployAction.href ? (
								<Link href={deployAction.href}>
									<Button
										variant="gradient"
										rightSection={<Icon path={iconChevronRight} />}
										onClick={openHandle.close}
									>
										{deployAction.label}
									</Button>
								</Link>
							) : (
								<Button
									variant="gradient"
									rightSection={<Icon path={iconChevronRight} />}
									onClick={openHandle.close}
								>
									{deployAction.label}
								</Button>
							))}
					</Group>
				</Stack>
			</Paper>
		</Modal>
	);
}

// -- Sandbox --

interface SandboxOnboardingProps {
	enabled: boolean;
}

export function SandboxOnboarding({ enabled }: SandboxOnboardingProps) {
	return (
		<OnboardingModal
			onboardingKey="sandbox"
			enabled={enabled}
			title="Sandbox"
			subtitle="Draft, Prototype, and Deploy"
			description="The Sandbox is your local drafting environment. Design schemas, model relationships, and prototype queries without a live database - then deploy straight to SurrealDB Cloud when you're ready."
			media={<Image src={sandboxBanner} />}
		>
			<List.Item>Design and iterate on schemas, tables, and relationships locally</List.Item>
			<List.Item>Prototype SurrealQL queries with instant feedback</List.Item>
			<List.Item>Load official datasets to explore and learn</List.Item>
			<List.Item>Deploy your finished schema directly to SurrealDB Cloud</List.Item>
		</OnboardingModal>
	);
}

// -- Cloud Instances --

interface InstancesOnboardingProps {
	deployHref?: string;
}

export function InstancesOnboarding({ deployHref }: InstancesOnboardingProps) {
	return (
		<OnboardingModal
			onboardingKey="cloud-instances"
			enabled
			title="SurrealDB"
			subtitle="The context layer for AI agents"
			description="SurrealDB is the database where storage, context, and memory are one transaction. Documents, graphs, vectors, time-series, and relational data as native primitives in a single ACID transaction - no plugins, no bolt-ons."
			learnMoreHref="https://surrealdb.com/platform/surrealdb"
			deployAction={{ label: "Get started", href: deployHref }}
			media={<Image src={instanceBanner} />}
		>
			<List.Item>
				Native multi-model engine unifying documents, graphs, vectors, full-text search, and
				time-series
			</List.Item>
			<List.Item>
				Deploy anywhere - from embedded and edge devices to highly scalable cloud
			</List.Item>
			<List.Item>
				Built-in real-time subscriptions, event triggers, and streaming updates
			</List.Item>
			<List.Item>
				Enterprise security with RBAC, record-level permissions, and JWT auth
			</List.Item>
		</OnboardingModal>
	);
}

// -- Cloud Contexts (Spectron) --

interface ContextsOnboardingProps {
	deployHref?: string;
}

export function ContextsOnboarding({ deployHref }: ContextsOnboardingProps) {
	return (
		<OnboardingModal
			onboardingKey="cloud-contexts"
			enabled
			title="Spectron"
			subtitle="Agent Memory That Actually Works"
			description="Spectron gives your AI agents persistent, queryable memory powered by knowledge graphs, entity extraction, temporal facts, and hybrid retrieval - built directly into SurrealDB rather than bolted on top."
			learnMoreHref="https://surrealdb.com/docs/spectron"
			deployAction={{ label: "Get started", href: deployHref }}
			media={<Image src={spectronBanner} />}
		>
			<List.Item>Automatically extract memories and facts from conversations</List.Item>
			<List.Item>Hybrid retrieval combining graph traversal and vector similarity</List.Item>
			<List.Item>Temporal awareness with tri-temporal, append-only facts</List.Item>
			<List.Item>Multi-agent shared memory with full ACID transactions</List.Item>
		</OnboardingModal>
	);
}
