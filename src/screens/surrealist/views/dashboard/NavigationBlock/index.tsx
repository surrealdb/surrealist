import classes from "./style.module.scss";

import { Box, Group, Paper, SimpleGrid, Skeleton, ThemeIcon } from "@mantine/core";
import { Text } from "@mantine/core";
import { Link } from "wouter";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { iconAuth, iconChevronRight, iconDesigner, iconExplorer, iconQuery } from "~/util/icons";

export interface NavigationBlockProps {
	isLoading: boolean;
}

export function NavigationBlock({ isLoading }: NavigationBlockProps) {
	return (
		<SimpleGrid
			cols={4}
			spacing="xl"
		>
			<Link href="query">
				<NavigationBox
					icon={iconQuery}
					color="surreal"
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
			<Paper
				p="md"
				className={classes.navigationBox}
			>
				<Group wrap="nowrap">
					<ThemeIcon
						variant="light"
						bg="slate"
						radius="xs"
						color={color}
						size={38}
					>
						<Icon
							path={icon}
							size="xl"
						/>
					</ThemeIcon>
					<Box>
						<Text
							c="bright"
							fw={600}
							fz="xl"
							lh={1}
						>
							{title}
						</Text>
						<Text mt="xs">{description}</Text>
					</Box>
					<Spacer />
					<Icon path={iconChevronRight} />
				</Group>
			</Paper>
		</Skeleton>
	);
}
