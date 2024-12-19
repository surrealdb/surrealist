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
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Slab, SlabProps } from "~/components/Slab";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { ON_FOCUS_SELECT, showError } from "~/util/helpers";
import { iconCheck, iconCopy } from "~/util/icons";
import { useCloudReferralQuery } from "../../hooks/referral";

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
			<Box p="xl">
				<Image
					src={icon}
					alt=""
					w={48}
				/>
				<Text
					mt="xl"
					fw={600}
					fz={18}
					c="bright"
				>
					{title}
				</Text>
				<Text>{description}</Text>
			</Box>
		</Slab>
	);
}

export function ReferralPage() {
	const referralQuery = useCloudReferralQuery();
	const isLight = useIsLight();

	const referralLink = `https://surrealist.app/referral?code=${referralQuery.data}`;
	const shareOptions = {
		title: "Surreal Cloud",
		text: "Use my referral link to get started today!",
		url: referralLink,
	};

	const showShare = "canShare" in navigator && navigator.canShare(shareOptions);

	const shareLink = useStable(() => {
		navigator.share(shareOptions).catch((err: any) => {
			console.error(err);

			showError({
				title: "Failed to share referral link",
				subtitle: "Please copy it manually instead",
			});
		});
	});

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
									<Skeleton visible={referralQuery.isPending}>
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
													onClick={shareLink}
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
						<PrimaryTitle>Rewards</PrimaryTitle>
						<SimpleGrid
							mt="sm"
							cols={{ base: 1, xs: 3, sm: 2, md: 3, lg: 5 }}
						>
							<Reward
								title="1-5 referrals"
								description="Discount codes"
								icon={isLight ? tier1LightUrl : tier1DarkUrl}
							/>
							<Reward
								title="10 referrals"
								description="Exclusive store swag"
								icon={isLight ? tier2LightUrl : tier2DarkUrl}
							/>
							<Reward
								title="25 referrals"
								description="Exclusive Discord badge"
								icon={isLight ? tier3LightUrl : tier3DarkUrl}
							/>
							<Reward
								title="100 referrals"
								description="Exclusive store multi-pack"
								icon={isLight ? tier4LightUrl : tier4DarkUrl}
							/>
							<Reward
								title="500 referrals"
								description="Coming Soon"
								icon={isLight ? tier5LightUrl : tier5DarkUrl}
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
									Friends Sign Up
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
									You Get Rewarded
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
