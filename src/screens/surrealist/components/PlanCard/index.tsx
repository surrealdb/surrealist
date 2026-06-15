import { Box, Checkbox, Group, Paper, Stack, Text, Title } from "@mantine/core";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Label } from "~/components/Label";
import { PLAN_PERIOD_LABELS } from "~/constants";
import { useIsLight } from "~/hooks/theme";
import { PlanPeriod } from "~/types";
import classes from "./style.module.scss";

export function formatPrice(millcents: number) {
	const cost = millcents / 1000;

	return cost.toLocaleString("en-US", {
		minimumFractionDigits: 0,
		style: "currency",
		currency: "USD",
	});
}

export interface PlanCardContent {
	label: string;
	features: string[];
}

export interface PlanCardProps {
	name: string;
	description?: string;
	priceMillcents: number;
	pricePeriod: PlanPeriod;
	contents: PlanCardContent[];
	trialDays?: number;
	disabled?: boolean;
	footer?: ReactNode;
}

export function PlanCard({
	name,
	description,
	priceMillcents,
	pricePeriod,
	trialDays,
	contents,
	disabled = false,
	footer,
}: PlanCardProps) {
	const priceLabel = formatPrice(priceMillcents);
	const isLight = useIsLight();

	return (
		<Paper
			h="100%"
			p="xl"
			className={clsx(disabled && classes.planDisabled)}
		>
			<Stack h="100%">
				<Group>
					<Box
						flex={1}
						className="selectable"
					>
						<Group>
							<Text
								c="bright"
								fw={600}
								fz="h3"
							>
								{name}
							</Text>
						</Group>

						<Text>{description}</Text>
					</Box>

					<Stack gap="sm">
						<Group
							gap={8}
							align="center"
							wrap="nowrap"
							className="selectable"
						>
							<Title
								order={2}
								c="bright"
								fz={32}
								lh={1.1}
							>
								{priceLabel}
							</Title>
							{priceMillcents > 0 && (
								<Text
									c="obsidian.4"
									fz="xs"
									lh={1.1}
								>
									per
									<br />
									{PLAN_PERIOD_LABELS[pricePeriod]}
								</Text>
							)}
						</Group>
						{trialDays !== undefined && trialDays > 0 && (
							<Text
								c={!isLight ? "violet.3" : "violet.7"}
								fz="sm"
								lh={1}
							>
								{trialDays} day free trial
							</Text>
						)}
					</Stack>
				</Group>

				{contents.map((content) => (
					<>
						<Label mt="xl">{content.label}</Label>
						<Stack className="selectable">
							{content.features.map((feat) => (
								<Group
									gap="sm"
									key={feat}
								>
									<Checkbox
										readOnly
										checked
										size="sm"
										radius="xl"
										variant="gradient"
										tabIndex={-1}
										styles={{
											input: {
												borderRadius: "var(--mantine-radius-xl)",
											},
											icon: {
												width: 9,
											},
										}}
									/>
									{feat}
								</Group>
							))}
						</Stack>
					</>
				))}

				{footer}
			</Stack>
		</Paper>
	);
}
