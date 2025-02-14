import classes from "./style.module.scss";

import glowUrl from "~/assets/images/gradient-glow.webp";

import iconDarkUrl from "~/assets/images/dark/referral-icon.png";
import logoDarkUrl from "~/assets/images/dark/referral-logo.png";
import tier1DarkUrl from "~/assets/images/dark/referral-tier-1.png";
import tier2DarkUrl from "~/assets/images/dark/referral-tier-2.png";
import tier3DarkUrl from "~/assets/images/dark/referral-tier-3.png";
import tier4DarkUrl from "~/assets/images/dark/referral-tier-4.png";
import tier5DarkUrl from "~/assets/images/dark/referral-tier-5.png";

import iconLightUrl from "~/assets/images/light/referral-icon.png";
import logoLightUrl from "~/assets/images/light/referral-logo.png";
import tier1LightUrl from "~/assets/images/light/referral-tier-1.png";
import tier2LightUrl from "~/assets/images/light/referral-tier-2.png";
import tier3LightUrl from "~/assets/images/light/referral-tier-3.png";
import tier4LightUrl from "~/assets/images/light/referral-tier-4.png";
import tier5LightUrl from "~/assets/images/light/referral-tier-5.png";

import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Group,
	Image,
	Progress,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";

import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Slab, SlabProps } from "~/components/Slab";
import { useIsLight } from "~/hooks/theme";
import { ON_FOCUS_SELECT } from "~/util/helpers";
import { iconCheck, iconCopy, iconHelp } from "~/util/icons";
import {
	useCloudReferralCodeQuery,
	useCloudReferralQuery,
} from "../../../../../cloud/queries/referral";

const REWARDS = [1, 10, 25, 100, 500];

interface RewardProps extends Omit<SlabProps, "title"> {
	title: ReactNode;
	description: ReactNode;
	icon: string;
	active?: boolean;
}

function Reward({ title, description, icon, active, ...other }: RewardProps) {
	return (
		<Slab
			h={170}
			{...other}
		>
			<Box
				p="xl"
				c={active ? "white" : undefined}
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
		</Slab>
	);
}

export function ReferralPage() {
	const referralQuery = useCloudReferralQuery();
	const referralCodeQuery = useCloudReferralCodeQuery();
	const isLight = useIsLight();

	const referralLink = `https://surrealist.app/referral?code=${referralCodeQuery.data}`;
	const shareOptions = {
		title: "Surreal Cloud",
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
		<Box
			flex={1}
			pos="relative"
		>
			<div
				className={classes.glow}
				style={{
					backgroundImage: `url(${glowUrl})`,
				}}
			/>
			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBottom: 75 },
				}}
			>
				<Stack
					w="100%"
					maw={900}
					mx="auto"
					gap={38}
					pos="relative"
				>
					<Image
						src={isLight ? logoLightUrl : logoDarkUrl}
						alt="Surreal Cloud"
						mx="auto"
						w={450}
					/>

					<Slab
						p="xl"
						shadow="md"
						radius={28}
					>
						<Group gap={0}>
							<Box style={{ alignSelf: "start" }}>
								<Image
									src={isLight ? iconLightUrl : iconDarkUrl}
									w={250}
									ml={-46}
									mr={-12}
									my={-32}
								/>
							</Box>
							<Stack
								gap={28}
								flex={1}
							>
								<Box>
									<PrimaryTitle>
										Share Surreal Cloud and earn rewards
									</PrimaryTitle>
									<Text mt={2}>
										The Surreal Cloud referral program allows you to invite a
										friend in exchange for benefits.
									</Text>
								</Box>

								<Box>
									<Label>Your referral link</Label>
									<Skeleton visible={referralCodeQuery.isPending}>
										<Group>
											<TextInput
												flex={1}
												value={referralLink}
												readOnly
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
												>
													Share
												</Button>
											)}
										</Group>
									</Skeleton>
								</Box>
							</Stack>
						</Group>
					</Slab>

					<Box>
						<PrimaryTitle>Progress</PrimaryTitle>
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
							mt="md"
							value={progress}
							bg={isLight ? "slate.2" : "slate"}
							styles={{
								root: {
									overflow: "unset",
								},
								section: {
									background: "var(--surrealist-gradient)",
									boxShadow: "var(--surrealist-glow)",
								},
							}}
						/>
					</Box>

					<Box>
						<PrimaryTitle>Rewards</PrimaryTitle>
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
													You receive $10 credits per referral, for a
													maximum of $50. The person you invite receives
													$25.
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

					<Box>
						<PrimaryTitle>How does this work?</PrimaryTitle>
						<SimpleGrid
							mt="sm"
							cols={{
								base: 1,
								md: 3,
							}}
						>
							<Slab p="xl">
								<Text
									fw={600}
									fz={18}
									c="bright"
								>
									Share your link
								</Text>
								<Text mt="xs">
									Copy your unique referral link from your account dashboard and
									share it with friends, family, or anyone you think would benefit
									from our services.
								</Text>
							</Slab>
							<Slab p="xl">
								<Text
									fw={600}
									fz={18}
									c="bright"
								>
									Friends sign up
								</Text>
								<Text mt="xs">
									When someone uses your link to sign up, they'll get a special
									reward or discount as a welcome gift.
								</Text>
							</Slab>
							<Slab p="xl">
								<Text
									fw={600}
									fz={18}
									c="bright"
								>
									You get rewarded
								</Text>
								<Text mt="xs">
									Once your referral completes a qualifying action (like making a
									purchase or reaching a milestone), you'll receive your reward
									too!
								</Text>
							</Slab>
						</SimpleGrid>
					</Box>
				</Stack>
			</ScrollArea>
		</Box>
	);
}

export default ReferralPage;
