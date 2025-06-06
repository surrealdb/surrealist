import {
	Alert,
	Box,
	Collapse,
	Group,
	Paper,
	Text,
	ThemeIcon,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";

import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useIsLight } from "~/hooks/theme";
import { CapabilityBaseProps } from "./shared";

import { iconChevronDown, iconChevronUp, iconHelp } from "~/util/icons";

import { Link } from "~/components/Link";

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
									path={iconHelp}
									size="lg"
								/>
							</ThemeIcon>
							<Box>
								<Text
									fw={600}
									c="bright"
								>
									Please contact support
								</Text>
								<Text>
									This capability is currently not configurable from Surrealist.
									Please reach out to{" "}
									<Link href="mailto:support@surrealdb.com">
										support@surrealdb.com
									</Link>{" "}
									if you require this capability to be configured for your
									instance.
								</Text>
								<Alert
									title="Important"
									color="orange"
									mt="xl"
								>
									Reach out using the email address associated with your Surreal
									Cloud account.
								</Alert>
							</Box>
						</Group>
					</Paper>
				</Box>
			</Collapse>
		</Box>
	);
}
