import {
	Box,
	Collapse,
	Group,
	Paper,
	Text,
	ThemeIcon,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconChevronDown, iconChevronUp, iconDownload, iconHelp } from "@surrealdb/ui";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useIsLight } from "~/hooks/theme";
import { CapabilityBaseProps } from "./shared";

export function SupportCapability({ name, description }: CapabilityBaseProps) {
	const isLight = useIsLight();
	const [isExpanded, expandedHandle] = useBoolean();

	return (
		<Box>
			<UnstyledButton
				onClick={expandedHandle.toggle}
				w="100%"
			>
				<Group
					gap="xs"
					mih={36}
				>
					<Text
						fz="lg"
						fw={500}
						c="bright"
					>
						{name}
					</Text>
					{description && (
						<Tooltip label={description}>
							<div>
								<Icon
									path={iconHelp}
									size="sm"
								/>
							</div>
						</Tooltip>
					)}
					<Spacer />
					<Group
						py="sm"
						gap="sm"
					>
						<Icon path={isExpanded ? iconChevronUp : iconChevronDown} />
					</Group>
				</Group>
			</UnstyledButton>
			<Collapse in={isExpanded}>
				<Box pt="xs">
					<Paper
						my="xl"
						bg={isLight ? "slate.0" : "slate.7"}
						p="md"
					>
						<Group
							align="start"
							wrap="nowrap"
						>
							<ThemeIcon
								radius="xs"
								size={38}
								color="slate"
								variant="light"
							>
								<Icon
									path={iconDownload}
									size="lg"
								/>
							</ThemeIcon>
							<Box>
								<Text
									fw={600}
									c="bright"
								>
									Please update your instance version
								</Text>
								<Text>
									This capability is only supported in a newer version of
									SurrealDB.
								</Text>
							</Box>
						</Group>
					</Paper>
				</Box>
			</Collapse>
		</Box>
	);
}
