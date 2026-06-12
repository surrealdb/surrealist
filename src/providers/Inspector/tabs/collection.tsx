import { Badge, Box, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import type { RecordId } from "surrealdb";
import { RecordLink } from "~/components/RecordLink";
import classes from "../style.module.scss";

export interface RecordCollectionProps {
	title: string;
	description: string;
	icon: string;
	records: RecordId[];
	emptyText: string;
}

/**
 * A titled, colour-accented list of linked records used by the relations and
 * references tabs, with a count badge and a friendly empty state.
 */
export function RecordCollection({
	title,
	description,
	icon,
	records,
	emptyText,
}: RecordCollectionProps) {
	return (
		<Box>
			<Group mb="sm">
				<ThemeIcon
					variant="gradient"
					radius="sm"
					size="md"
				>
					<Icon path={icon} />
				</ThemeIcon>
				<Box>
					<Group gap="xs">
						<Text
							c="bright"
							fw={600}
							fz="lg"
						>
							{title}
						</Text>
						{records.length > 0 && (
							<Badge
								variant="light"
								px={6}
							>
								{records.length}
							</Badge>
						)}
					</Group>
					<Text fz="sm">{description}</Text>
				</Box>
			</Group>

			{records.length === 0 ? (
				<Paper
					className={classes.emptyCollection}
					p="lg"
				>
					<Text
						ta="center"
						c="obsidian"
					>
						{emptyText}
					</Text>
				</Paper>
			) : (
				<Stack gap="xs">
					{records.map((record) => (
						<Paper
							key={record.toString()}
							className={classes.recordRow}
							px="md"
							py="xs"
						>
							<RecordLink value={record} />
						</Paper>
					))}
				</Stack>
			)}
		</Box>
	);
}
