import { Group, Image, Paper, Text } from "@mantine/core";
import { SectionTitle } from "@surrealdb/ui";
import type { ReactNode } from "react";
import classes from "./style.module.scss";

export interface ContextHeroProps {
	/** Small uppercase label above the title. */
	kicker: string;
	/** The hero title (gradient). */
	title: ReactNode;
	/** Supporting copy beneath the title. */
	description?: ReactNode;
	/** Decorative picto rendered in the corner. */
	art?: string;
	/** Action buttons rendered beneath the heading. */
	children?: ReactNode;
}

/**
 * The standard glass header used at the top of every context page — keeps the
 * kicker / gradient-title / description rhythm consistent across the surface.
 */
export function ContextHero({ kicker, title, description, art, children }: ContextHeroProps) {
	return (
		<Paper
			p="xl"
			radius="lg"
			variant="glass"
			className={classes.hero}
		>
			{art && (
				<Image
					src={art}
					className={classes.art}
					alt=""
					aria-hidden
				/>
			)}
			<SectionTitle
				kicker={kicker}
				titleProps={{ variant: "gradient", fz: { base: 26, sm: 32 } }}
			>
				{title}
			</SectionTitle>
			{description && (
				<Text
					c="dimmed"
					mt="xs"
					maw={640}
					className="selectable"
				>
					{description}
				</Text>
			)}
			{children && (
				<Group
					gap="sm"
					mt="lg"
				>
					{children}
				</Group>
			)}
		</Paper>
	);
}
