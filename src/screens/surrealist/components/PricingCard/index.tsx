import { Box, Checkbox, Group, Paper, Stack, Text } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import clsx from "clsx";
import { PricingConfigBase, PricingConfigCloud } from "~/cloud/queries/pricing";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { CURRENCY_FORMAT } from "~/util/helpers";
import { iconArrowLeft } from "~/util/icons";
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
		<Paper
			p="xl"
			role="button"
			tabIndex={0}
			variant={disabled ? "disabled" : state === "future" ? "gradient" : "interactive"}
			className={clsx(
				recommended && classes.planRecommended,
				state === "future" && classes.planDisabled,
			)}
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
		>
			<Stack h="100%">
				<Box>
					<Text fz={22}>{config.name}</Text>
					{state === "contact" ? (
						<PrimaryTitle fz={22}>Contact us</PrimaryTitle>
					) : state === "future" ? (
						<PrimaryTitle fz={22}>Coming soon</PrimaryTitle>
					) : config.price === 0 ? (
						<PrimaryTitle fz={22}>Free</PrimaryTitle>
					) : typeof config.price === "string" ? (
						<PrimaryTitle fz={22}>{config.price}</PrimaryTitle>
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
								size="xs"
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
										size="xs"
									/>
									{resource}
								</Group>
							))}
						</Stack>
					</>
				)}
				<Spacer />
				<Group
					mt="md"
					gap="xs"
					justify="end"
					c={disabled ? "slate" : state === "future" ? "slate" : "surreal"}
				>
					<Text inherit>
						{actionText ??
							(state === "available"
								? ctaText
								: state === "future"
									? "Coming soon"
									: "Contact us")}
					</Text>
					<Icon
						className={classes.startBlogArrow}
						path={iconArrowLeft}
						flip="horizontal"
					/>
				</Group>
			</Stack>
		</Paper>
	);
}

function isCloudConfig(config: PricingConfigBase): config is PricingConfigCloud {
	return "resources" in config;
}
