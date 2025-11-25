import {
	Badge,
	Box,
	Button,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import { group } from "radash";
import { useMemo } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { Spacer } from "~/components/Spacer";
import { MigrationDiagnosticResult } from "~/types";
import { iconCheck, iconErrorCircle, iconList } from "~/util/icons";
import { severityMeta } from "../MigrationView/severities";
import classes from "./styles.module.scss";

export interface DiagnosticListPanelProps {
	diagnostics: MigrationDiagnosticResult[];
	selectedDiagnostic: MigrationDiagnosticResult | null;
	completedOrigins: Set<string>;
	onSelectDiagnostic: (diagnostic: MigrationDiagnosticResult) => void;
	onToggleOrigin: (origin: string) => void;
	onRerun: () => void;
	isFetching: boolean;
}

export function DiagnosticsListPanel({
	diagnostics,
	// selectedDiagnostic,
	completedOrigins,
	onSelectDiagnostic,
	onToggleOrigin,
	onRerun,
	isFetching,
}: DiagnosticListPanelProps) {
	const entries = useMemo(() => {
		return Object.entries(group(diagnostics, (diagnostic) => diagnostic.origin));
	}, [diagnostics]);

	return (
		<ContentPane
			title="Diagnostics"
			icon={iconList}
			rightSection={
				<Button
					variant="gradient"
					size="xs"
					onClick={onRerun}
					loading={isFetching}
				>
					Re-run diagnostics
				</Button>
			}
		>
			<ScrollArea
				style={{
					position: "absolute",
					inset: 12,
					top: 0,
					bottom: 54,
				}}
			>
				<Stack>
					{entries.map(([origin, sourceDiagnostics], index) => {
						const isOriginCompleted = completedOrigins.has(origin);

						return (
							<Box
								key={origin}
								style={{
									opacity: isOriginCompleted ? 0.6 : 1,
								}}
							>
								<Group
									gap="xs"
									align="center"
								>
									<Text
										fz="xl"
										fw={500}
										c="bright"
									>
										{index + 1}.
									</Text>
									<Text fw={500}>Source:</Text>
									<Text
										fw={500}
										ff="monospace"
									>
										{origin}
									</Text>
									{isOriginCompleted && (
										<Badge
											size="xs"
											color="green.6"
											variant="light"
										>
											Completed
										</Badge>
									)}
									<Spacer />
									<ActionButton
										label={
											isOriginCompleted
												? "Re-open source"
												: "Mark as completed"
										}
										color={isOriginCompleted ? "slate" : "green"}
										variant="subtle"
										onClick={() => onToggleOrigin(origin)}
									>
										<Icon path={iconCheck} />
									</ActionButton>
								</Group>
								<Stack mt="xs">
									{sourceDiagnostics?.map((diagnostic, diagnosticIndex) => {
										// const isSelected = selectedDiagnostic === diagnostic;
										const meta = severityMeta[diagnostic.severity];

										return (
											<UnstyledButton
												w="100%"
												key={`${origin}-${diagnosticIndex}`}
												className={classes.card}
												// mod={{ selected: isSelected }}
												onClick={() => onSelectDiagnostic(diagnostic)}
											>
												<Paper
													p="sm"
													radius="lg"
												>
													<Group align="flex-start">
														<ThemeIcon
															size="lg"
															color={meta.color}
															variant="light"
															radius="sm"
														>
															<Icon path={iconErrorCircle} />
														</ThemeIcon>
														<Box style={{ flex: 1 }}>
															<Group gap="xs">
																<Text
																	fw={500}
																	c="bright"
																>
																	{diagnostic.error}
																</Text>
																<Badge
																	color={meta.color}
																	variant="light"
																	size="xs"
																>
																	{meta.label}
																</Badge>
															</Group>
															<Text
																c="slate"
																size="sm"
															>
																{diagnostic.details}
															</Text>
															{diagnostic.location && (
																<Text
																	mt={4}
																	c="dimmed"
																	size="xs"
																>
																	{diagnostic.location.label} ·
																	line {diagnostic.location.line},{" "}
																	column{" "}
																	{diagnostic.location.column}
																</Text>
															)}
														</Box>
													</Group>
												</Paper>
											</UnstyledButton>
										);
									})}
								</Stack>
							</Box>
						);
					})}
				</Stack>
			</ScrollArea>
		</ContentPane>
	);
}
