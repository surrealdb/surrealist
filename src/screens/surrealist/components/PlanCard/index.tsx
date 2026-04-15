import { Box, Checkbox, Group, Paper, Stack, Text, Title } from "@mantine/core";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Label } from "~/components/Label";
import classes from "./style.module.scss";

export function formatPrice(millcents: number) {
	const dollars = millcents / 100_000;

	return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}

export interface PlanCardContent {
	label: string;
	features: string[];
}

export interface PlanCardProps {
	name: string;
	description?: string;
	priceMillcents: number;
	pricePeriod: "month" | "year";
	contents: PlanCardContent[];
	disabled?: boolean;
	footer?: ReactNode;
	isActive?: boolean;
}

export function PlanCard({
	name,
	description,
	priceMillcents,
	pricePeriod,
	contents,
	disabled = false,
	footer,
	isActive = false,
}: PlanCardProps) {
	const priceLabel = formatPrice(priceMillcents);

	return (
		<Paper
			h="100%"
			p="xl"
			className={clsx(disabled && classes.planDisabled)}
			// withBorder
			// style={{
			// 	borderColor: isActive ? "var(--surreal-focus-outline)" : undefined,
			// 	cursor: isActive ? "default" : "pointer",
			// }}
		>
			<Stack h="100%">
				<Group>
					<Box flex={1}>
						<Text
							c="bright"
							fw={600}
							fz="h3"
						>
							{name}
						</Text>

						<Text>{description}</Text>
					</Box>
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
								{pricePeriod}
							</Text>
						)}
					</Group>
				</Group>

				{contents.map((content) => (
					<>
						<Label mt="xl">{content.label}</Label>
						<Stack>
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
