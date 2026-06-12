import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Group,
	Image,
	Paper,
	PaperProps,
	Progress,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";
import {
	Icon,
	iconCheck,
	iconChevronRight,
	iconCopy,
	iconHelp,
	pictoChatHeart,
	SectionTitle,
} from "@surrealdb/ui";
import { ReactNode } from "react";
import tier1DarkUrl from "~/assets/images/dark/referral-tier-1.png";
import tier2DarkUrl from "~/assets/images/dark/referral-tier-2.png";
import tier3DarkUrl from "~/assets/images/dark/referral-tier-3.png";
import tier4DarkUrl from "~/assets/images/dark/referral-tier-4.png";
import tier5DarkUrl from "~/assets/images/dark/referral-tier-5.png";
import tier1LightUrl from "~/assets/images/light/referral-tier-1.png";
import tier2LightUrl from "~/assets/images/light/referral-tier-2.png";
import tier3LightUrl from "~/assets/images/light/referral-tier-3.png";
import tier4LightUrl from "~/assets/images/light/referral-tier-4.png";
import tier5LightUrl from "~/assets/images/light/referral-tier-5.png";
import glowImage from "~/assets/images/radial-glow.png";
import { useCloudReferralCodeQuery, useCloudReferralQuery } from "~/cloud/queries/referral";
import { Label } from "~/components/Label";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { useIsLight } from "~/hooks/theme";
import { useAuthentication } from "~/providers/Auth";
import { ON_FOCUS_SELECT } from "~/util/helpers";
import { PageContainer } from "../../components/PageContainer";
import classes from "./style.module.scss";

const REWARDS = [1, 10, 25, 100, 500];

interface RewardProps extends Omit<PaperProps, "title"> {
	title: ReactNode;
	description: ReactNode;
	icon: string;
	active?: boolean;
}

function Reward({ title, description, icon, active, ...other }: RewardProps) {
	const isLight = useIsLight();

	return (
		<Paper {...other}>
			<Box
				p="xl"
				c={!isLight && active ? "white" : undefined}
			>
				<Image
					src={icon}
					alt=""
					w={48}
					style={{
						filter: active
							? "drop-shadow(0 0px 14px rgba(186, 0, 171, 1))"
							: "grayscale(100)",
					}}
				/>
				<Text
					mt="xl"
					fw={600}
					fz={18}
				>
					{title}
				</Text>
				<Box opacity={0.75}>{description}</Box>
			</Box>
		</Paper>
	);
}

export function ReferralPage() {
	const referralQuery = useCloudReferralQuery();
	const referralCodeQuery = useCloudReferralCodeQuery();
	const { isAuthenticated, signIn } = useAuthentication();
	const isLight = useIsLight();

	const referralLink = `https://app.surrealdb.com/referral?code=${referralCodeQuery.data}`;
	const shareOptions = {
		title: "SurrealDB Cloud",
		text: "Use my referral link to get started today!",
		url: referralLink,
	};

	const referrals = referralQuery.data ?? 0;
	const showShare = "canShare" in navigator && navigator.canShare(shareOptions);

	const nextReward = REWARDS.find((r) => r > referrals) ?? 500;
	const currentReward = REWARDS.findLast((r) => r <= referrals) ?? 0;
	const toRefer = nextReward - referrals;
	const progress = ((referrals - currentReward) / (nextReward - 1)) * 100;

	return (
		<>
			<PageBreadcrumbs items={[{ label: "Referral Program" }]} />
			<PageContainer>
				<SectionTitle>Referral Program</SectionTitle>

				<Paper
					p="xl"
					style={{ overflow: "hidden", position: "relative" }}
				>
					<Group gap="xl">
						<Box
							mx="xl"
							style={{ alignSelf: "center" }}
							visibleFrom="sm"
						>
							<Image
								src={glowImage}
								opacity={0.5}
								w={100}
								style={{
									transform: "scale(2.5)",
									transition: "opacity 0.3s ease",
									position: "absolute",
									zIndex: 0,
								}}
							/>
							<Image
								src={pictoChatHeart}
								w={100}
								style={{
									position: "relative",
									zIndex: 1,
								}}
							/>
						</Box>
						<Stack
							gap="lg"
							flex={1}
						>
							<Box>
								<SectionTitle order={2}>
									Share SurrealDB Cloud and earn rewards
								</SectionTitle>
								<Text mt={2}>
									The SurrealDB Cloud referral program allows you to invite a
									friend in exchange for benefits.
								</Text>
							</Box>

							{isAuthenticated ? (
								<Box>
									<Label>Your referral link</Label>
									<Skeleton visible={referralCodeQuery.isPending}>
										<Group wrap="nowrap">
											<TextInput
												value={referralLink}
												readOnly
												flex={1}
												onFocus={ON_FOCUS_SELECT}
												rightSection={
													<CopyButton value={referralLink}>
														{({ copied, copy }) => (
															<ActionIcon
																variant={
																	copied ? "gradient" : undefined
																}
																aria-label="Copy referral link"
																onClick={copy}
																size="md"
															>
																<Icon
																	path={
																		copied
																			? iconCheck
																			: iconCopy
																	}
																/>
															</ActionIcon>
														)}
													</CopyButton>
												}
												classNames={{
													input: classes.link,
												}}
											/>
											{showShare && (
												<Button
													variant="gradient"
													onClick={() => navigator.share(shareOptions)}
													style={{ flexShrink: 0 }}
												>
													Share
												</Button>
											)}
										</Group>
									</Skeleton>
								</Box>
							) : (
								<Box>
									<Button
										variant="gradient"
										onClick={() => signIn()}
										rightSection={<Icon path={iconChevronRight} />}
										size="xs"
									>
										Sign in to get started
									</Button>
								</Box>
							)}
						</Stack>
					</Group>
				</Paper>

				<Box mt={36}>
					<SectionTitle order={2}>Progress</SectionTitle>
					<Text>
						You have referred{" "}
						<Text
							span
							c="bright"
							fz="xl"
							fw={500}
						>
							{referrals}
						</Text>{" "}
						users.
					</Text>
					<Text>
						Refer{" "}
						<Text
							span
							c="bright"
							fw={500}
						>
							{toRefer} more
						</Text>{" "}
						users to unlock the next reward.
					</Text>
					<Progress
						mt="lg"
						value={progress}
						bg={isLight ? "obsidian.2" : "obsidian"}
						styles={{
							root: {
								overflow: "unset",
							},
							section: {
								background: "var(--surrealist-gradient)",
							},
						}}
					/>
				</Box>

				<Box mt={36}>
					<SectionTitle order={2}>Unlockable rewards</SectionTitle>
					<SimpleGrid
						mt="sm"
						cols={{ base: 1, xs: 3, sm: 2, md: 3, lg: 5 }}
					>
						<Reward
							title="1-5 referrals"
							active={referrals >= 1}
							description={
								<Group gap="xs">
									Free credits
									<Tooltip
										position="bottom"
										label={
											<Text
												w={150}
												style={{ whiteSpace: "pre-line" }}
											>
												You receive $10 credits per referral, for a maximum
												of $50. The person you invite receives $25.
											</Text>
										}
									>
										<Box>
											<Icon
												path={iconHelp}
												size="sm"
											/>
										</Box>
									</Tooltip>
								</Group>
							}
							icon={isLight ? tier1LightUrl : tier1DarkUrl}
						/>
						<Reward
							title="10 referrals"
							description="Exclusive store swag"
							icon={isLight ? tier2LightUrl : tier2DarkUrl}
							active={referrals >= 10}
						/>
						<Reward
							title="25 referrals"
							description="Exclusive Discord badge"
							icon={isLight ? tier3LightUrl : tier3DarkUrl}
							active={referrals >= 25}
						/>
						<Reward
							title="100 referrals"
							description="Exclusive store multi-pack"
							icon={isLight ? tier4LightUrl : tier4DarkUrl}
							active={referrals >= 100}
						/>
						<Reward
							title="500 referrals"
							description="Coming Soon"
							icon={isLight ? tier5LightUrl : tier5DarkUrl}
							active={referrals >= 500}
							opacity={0.5}
						/>
					</SimpleGrid>
				</Box>

				<Box mt={36}>
					<SectionTitle order={2}>How does this work?</SectionTitle>
					<SimpleGrid
						mt="sm"
						cols={{
							base: 1,
							md: 3,
						}}
					>
						<Paper p="xl">
							<Text
								fw={600}
								fz={18}
								c="bright"
							>
								Share your link
							</Text>
							<Text mt="xs">
								Copy your unique referral link from your account dashboard and share
								it with friends, family, or anyone you think would benefit from our
								services.
							</Text>
						</Paper>
						<Paper p="xl">
							<Text
								fw={600}
								fz={18}
								c="bright"
							>
								Friends sign up
							</Text>
							<Text mt="xs">
								When someone uses your link to sign up, they'll get a special reward
								or discount as a welcome gift.
							</Text>
						</Paper>
						<Paper p="xl">
							<Text
								fw={600}
								fz={18}
								c="bright"
							>
								You get rewarded
							</Text>
							<Text mt="xs">
								Once your referral completes a qualifying action (like making a
								purchase or reaching a milestone), you'll receive your reward too!
							</Text>
						</Paper>
					</SimpleGrid>
				</Box>
			</PageContainer>
		</>
	);
}
