import classes from "./style.module.scss";

import glowUrl from "~/assets/images/gradient-glow.webp";

import logoDarkUrl from "~/assets/images/dark/referral-logo.png";
import iconDarkUrl from "~/assets/images/dark/referral-icon.png";
import tier1DarkUrl from "~/assets/images/dark/referral-tier-1.png";
import tier2DarkUrl from "~/assets/images/dark/referral-tier-2.png";
import tier3DarkUrl from "~/assets/images/dark/referral-tier-3.png";
import tier4DarkUrl from "~/assets/images/dark/referral-tier-4.png";
import tier5DarkUrl from "~/assets/images/dark/referral-tier-5.png";

import logoLightUrl from "~/assets/images/light/referral-logo.png";
import iconLightUrl from "~/assets/images/light/referral-icon.png";
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
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { iconCheck, iconCopy } from "~/util/icons";
import { ReactNode } from "react";
import { Icon } from "~/components/Icon";
import { Section } from "../../components/Section";
import { useCloudReferralQuery } from "../../hooks/referral";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { Slab } from "~/components/Slab";
import { useIsLight } from "~/hooks/theme";

interface RewardProps {
	title: ReactNode;
	description: ReactNode;
	icon: string;
	active?: boolean;
}

function Reward({ title, description, icon }: RewardProps) {
	return (
		<Slab style={{ aspectRatio: 1 }}>
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

	const referralLink = `https://surrealist.app/referral/${referralQuery.data}`;

	const shareLink = useStable(() => {
		navigator.share({
			title: "Surreal Cloud Referral",
			text: "Join Surreal Cloud and get rewards",
			url: referralLink,
		});
	});

	return (
		<Box pos="relative">
			<div
				className={classes.glow}
				style={{
					backgroundImage: `url(${glowUrl})`,
				}}
			/>

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
								<PrimaryTitle>Share Surreal Cloud and earn rewards</PrimaryTitle>
								<Text mt={2}>
									The Surreal Cloud referral program allows you to invite a friend
									in exchange for benefits.
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
																path={copied ? iconCheck : iconCopy}
															/>
														</ActionIcon>
													)}
												</CopyButton>
											}
											classNames={{
												input: classes.link,
											}}
										/>
										<Button
											variant="gradient"
											onClick={shareLink}
										>
											Share
										</Button>
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
						cols={{ base: 2, xs: 3, sm: 2, md: 3, lg: 5 }}
					>
						<Reward
							title="5 referrals"
							description="Unlock bragging rights"
							icon={isLight ? tier1LightUrl : tier1DarkUrl}
						/>
						<Reward
							title="10 referrals"
							description="A bunch of free credits"
							icon={isLight ? tier2LightUrl : tier2DarkUrl}
						/>
						<Reward
							title="25 referrals"
							description="Surreal swagg"
							icon={isLight ? tier3LightUrl : tier3DarkUrl}
						/>
						<Reward
							title="100 referrals"
							description="Huge respect"
							icon={isLight ? tier4LightUrl : tier4DarkUrl}
						/>
						<Reward
							title="500 referrals"
							description="Big brain"
							icon={isLight ? tier5LightUrl : tier5DarkUrl}
						/>
					</SimpleGrid>
				</Box>

				<Box>
					<PrimaryTitle>How does this work?</PrimaryTitle>
					<SimpleGrid
						cols={3}
						mt="sm"
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
								Copy your unique referral link from your account dashboard and share
								it with friends, family, or anyone you think would benefit from our
								services.
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
								When someone uses your link to sign up, they'll get a special reward
								or discount as a welcome gift.
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
								purchase or reaching a milestone), you'll receive your reward too!
							</Text>
						</Slab>
					</SimpleGrid>
				</Box>
			</Stack>
		</Box>
	);
}

export default ReferralPage;