import { Anchor, Box, Group, Paper, SimpleGrid, Skeleton, Text, ThemeIcon } from "@mantine/core";
import {
	Icon,
	iconAuth,
	iconChevronRight,
	iconDesigner,
	iconExplorer,
	iconQuery,
} from "@surrealdb/ui";
import { Link } from "wouter";
import { Spacer } from "~/components/Spacer";
import classes from "./style.module.scss";

export interface NavigationBlockProps {
	isLoading: boolean;
}

export function NavigationBlock({ isLoading }: NavigationBlockProps) {
	return (
		<SimpleGrid
			cols={{ base: 1, sm: 2, lg: 4 }}
			spacing="xl"
		>
			<Link href="query">
				<NavigationBox
					icon={iconQuery}
					color="violet"
					title="Run queries"
					description="Query your database"
					isLoading={isLoading}
				/>
			</Link>
			<Link href="explorer">
				<NavigationBox
					icon={iconExplorer}
					color="blue"
					title="Explore data"
					description="Browse your records"
					isLoading={isLoading}
				/>
			</Link>
			<Link href="authentication">
				<NavigationBox
					icon={iconAuth}
					color="green"
					title="Manage access"
					description="Control access rules"
					isLoading={isLoading}
				/>
			</Link>
			<Link href="designer">
				<NavigationBox
					icon={iconDesigner}
					color="orange"
					title="Design your schema"
					description="Structure your database"
					isLoading={isLoading}
				/>
			</Link>
		</SimpleGrid>
	);
}

interface NavigationBoxProps {
	icon: string;
	color: string;
	title: string;
	description: string;
	isLoading: boolean;
}

function NavigationBox({ icon, color, title, description, isLoading }: NavigationBoxProps) {
	return (
		<Skeleton visible={isLoading}>
			<Anchor variant="glow">
				<Paper
					p="md"
					withBorder
					className={classes.navigationBox}
				>
					<Group wrap="nowrap">
						<ThemeIcon
							variant="light"
							color={color}
							size={38}
						>
							<Icon
								path={icon}
								size="lg"
							/>
						</ThemeIcon>
						<Box>
							<Text
								c="bright"
								fw={700}
								fz="md"
								lh={1}
							>
								{title}
							</Text>
							<Text
								mt="xs"
								fz="xs"
							>
								{description}
							</Text>
						</Box>
						<Spacer />
						<Icon path={iconChevronRight} />
					</Group>
				</Paper>
			</Anchor>
		</Skeleton>
	);
}
