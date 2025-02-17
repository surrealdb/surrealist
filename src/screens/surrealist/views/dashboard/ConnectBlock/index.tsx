import { Paper, Box, Group, Text, ThemeIcon } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { iconAPI, iconChevronRight, iconConsole, iconSidekick } from "~/util/icons";

export function ConnectBlock() {
	return (
		<Box
			style={{
				display: "grid",
				gap: "var(--mantine-spacing-xl)",
			}}
		>
			<Paper>
				<Group
					wrap="nowrap"
					h="100%"
					px="md"
				>
					<ThemeIcon
						color="slate"
						size="xl"
					>
						<Icon
							path={iconConsole}
							size="xl"
						/>
					</ThemeIcon>
					<Box flex={1}>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							Connect with Surreal CLI
						</Text>
						<Text>For commandline environments</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						ml="md"
					/>
				</Group>
			</Paper>
			<Paper>
				<Group
					wrap="nowrap"
					h="100%"
					px="md"
				>
					<ThemeIcon
						color="slate"
						size="xl"
					>
						<Icon
							path={iconAPI}
							size="xl"
						/>
					</ThemeIcon>
					<Box flex={1}>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							Connect with an SDK
						</Text>
						<Text>For integrating SurrealDB</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						ml="md"
					/>
				</Group>
			</Paper>
			<Paper>
				<Group
					wrap="nowrap"
					h="100%"
					px="md"
				>
					<ThemeIcon
						color="slate"
						size="xl"
					>
						<Icon
							path={iconConsole}
							mx="md"
							size="xl"
						/>
					</ThemeIcon>
					<Box flex={1}>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							Connect with HTTP cURL
						</Text>
						<Text>For HTTP only environments</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						ml="md"
					/>
				</Group>
			</Paper>
		</Box>
	);
}
