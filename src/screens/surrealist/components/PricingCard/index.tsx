import { Anchor, Button, Checkbox, Group, Paper, Stack, Text, Title } from "@mantine/core";
import clsx from "clsx";
import { PricingConfigBase, PricingConfigCloud } from "~/cloud/queries/pricing";
import { Label } from "~/components/Label";
import { Spacer } from "~/components/Spacer";
import { dispatchIntent } from "~/util/intents";
import classes from "./style.module.scss";

export type PricingCardState = "available" | "future" | "contact";

export interface PricingCardProps {
	config?: PricingConfigBase;
	state: PricingCardState;
	actionText?: string;
	recommended?: boolean;
	disabled?: boolean;
	ctaText?: string;
	onClick?: (config: PricingConfigBase) => void;
}

export function PricingCard({
	config,
	state,
	recommended,
	actionText,
	ctaText,
	onClick,
	disabled,
}: PricingCardProps) {
	if (!config) {
		return null;
	}
	const isDedicated =
		config.name === "Dedicated" ||
		config.name === "Premium" ||
		config.name === "Enterprise Edition";

	const isHourly = typeof config.price === "number";
	const showFromPerHour = isHourly && !isDedicated;

	return (
		<Anchor
			h="100%"
			variant={!disabled && state !== "future" ? "glow" : undefined}
			onClick={() => {
				if (state === "contact") {
					dispatchIntent("create-message", {
						type: "conversation",
						conversationType: "sales-enquiry",
						subject: "Pricing enquiry",
						message: `Hello! I was interested in learning more about the ${config.name} plan. Could you provide me with more information? Thanks!`,
					});
				} else if (!disabled && state === "available" && onClick) {
					onClick(config);
				}
			}}
			style={{
				cursor: disabled ? "not-allowed" : state === "future" ? "default" : "pointer",
			}}
		>
			<Paper
				h="100%"
				p="xl"
				role="button"
				tabIndex={0}
				className={clsx(
					recommended && classes.planRecommended,
					state === "future" && classes.planDisabled,
				)}
			>
				<Stack h="100%">
					<Text
						c="slate.4"
						fw={600}
						lts="0.02em"
					>
						{config.name}
					</Text>

					{isHourly ? (
						<Group
							gap={8}
							align="center"
							wrap="nowrap"
						>
							<Title
								order={2}
								c="bright"
								fz={40}
								lh={1.1}
							>
								{typeof config.price === "number"
									? `$${config.price.toFixed(3)}`
									: config.price}
							</Title>
							{showFromPerHour && (
								<Text
									c="slate.4"
									fz="xs"
									className={classes.priceSuffix}
									lh={1.1}
								>
									From
									<br />
									per hour
								</Text>
							)}
						</Group>
					) : (
						<Text
							fw={600}
							c="bright"
							variant={isDedicated ? "gradient" : undefined}
							fz={40}
							lh={1.1}
						>
							{config.price}
						</Text>
					)}
					<Text>{config.description}</Text>
					<Label mt="xl">What you get</Label>
					<Stack>
						{config.features.map((feat) => (
							<Group
								gap="sm"
								c="bright"
								key={feat.name}
							>
								<Checkbox
									readOnly
									checked
									size="sm"
									variant="gradient"
									styles={{
										icon: {
											width: 9,
										},
									}}
								/>
								{feat.name}
								{feat.comingSoon && (
									<Text
										fz={18}
										c="slate"
										lh={0}
										ml="-xs"
									>
										*
									</Text>
								)}
							</Group>
						))}
					</Stack>
					{isCloudConfig(config) && (
						<>
							<Label mt="xl">Resources</Label>
							<Stack>
								{config.resources.map((resource) => (
									<Group
										gap="sm"
										c="bright"
										key={resource}
									>
										<Checkbox
											readOnly
											checked
											size="sm"
											variant="gradient"
											styles={{
												icon: {
													width: 9,
												},
											}}
										/>
										{resource}
									</Group>
								))}
							</Stack>
						</>
					)}
					<Spacer />
					<Button
						size="lg"
						fullWidth
						disabled={disabled || state === "future"}
					>
						{actionText ??
							(state === "available"
								? ctaText
								: state === "future"
									? "Coming soon"
									: "Contact us")}
					</Button>
				</Stack>
			</Paper>
		</Anchor>
	);
}

function isCloudConfig(config: PricingConfigBase): config is PricingConfigCloud {
	return "resources" in config;
}
