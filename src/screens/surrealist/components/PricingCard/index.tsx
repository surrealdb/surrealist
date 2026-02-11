import { Anchor, Box, Button, Checkbox, Group, Paper, Stack, Text } from "@mantine/core";
import clsx from "clsx";
import { PricingConfigBase, PricingConfigCloud } from "~/cloud/queries/pricing";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { CURRENCY_FORMAT } from "~/util/helpers";
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
					<Box>
						<Text
							fz={22}
							c="violet"
						>
							{config.name}
						</Text>
						{state === "contact" ? (
							<Text
								fz={22}
								fw={600}
								variant="gradient"
							>
								Contact us
							</Text>
						) : state === "future" ? (
							<Text
								fz={22}
								fw={600}
								variant="gradient"
							>
								Coming soon
							</Text>
						) : config.price === 0 ? (
							<Text
								fz={22}
								fw={600}
								c="bright"
							>
								Free
							</Text>
						) : typeof config.price === "string" ? (
							<Text
								fz={22}
								fw={600}
								c="bright"
							>
								{config.price}
							</Text>
						) : (
							<Box>
								<Group
									align="end"
									gap="xs"
								>
									<Text
										size="md"
										lh={2.25}
									>
										Starts at
									</Text>
									<PrimaryTitle fz={22}>
										{CURRENCY_FORMAT.format(config.price ?? 0)}
									</PrimaryTitle>
									<Text
										size="md"
										lh={2.25}
									>
										/ per hour
									</Text>
								</Group>
							</Box>
						)}
					</Box>
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
