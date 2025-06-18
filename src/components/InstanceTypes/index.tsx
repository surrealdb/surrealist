import { Badge, Box, Divider, Group, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { useMemo } from "react";
import { useInstanceTypeAvailable, useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { CloudInstanceType, CloudOrganization } from "~/types";
import { getTypeCategoryDescription, getTypeCategoryName } from "~/util/cloud";
import { CURRENCY_FORMAT, formatMemory } from "~/util/helpers";
import { iconAuth } from "~/util/icons";
import { Icon } from "../Icon";
import { Label } from "../Label";
import { PrimaryTitle } from "../PrimaryTitle";

const CATEGORIES = ["free", "development", "production", "production-compute", "production-memory"];

export interface InstanceTypesProps {
	value?: string;
	active?: string;
	organization: CloudOrganization;
	hideLimited?: boolean;
	onChange: (value: CloudInstanceType) => void;
}

export function InstanceTypes({
	value,
	active,
	organization,
	hideLimited,
	onChange,
}: InstanceTypesProps) {
	const instanceTypes = useInstanceTypeRegistry(organization);
	const isAvailable = useInstanceTypeAvailable(organization);

	const categories = useMemo(() => {
		const typeList = [...instanceTypes.values()];

		return CATEGORIES.flatMap((category) => {
			const types = typeList
				.filter((type) => type.category === category)
				.filter((type) => !hideLimited || isAvailable(type))
				.sort((a, b) => {
					return a.price_hour - b.price_hour;
				});

			if (types.length === 0) {
				return [];
			}

			return [{ category, types }];
		});
	}, [instanceTypes, isAvailable, hideLimited]);

	return (
		<Stack gap={28}>
			{categories.map(({ category, types }) => (
				<Box key={category}>
					<Box>
						<PrimaryTitle>{getTypeCategoryName(category)}</PrimaryTitle>
						<Text>{getTypeCategoryDescription(category)}</Text>
					</Box>
					<Stack mt="xl">
						{types.map((type) => (
							<InstanceTypeRow
								selected={value === type.slug}
								active={active === type.slug}
								key={type.slug}
								limited={false}
								restricted={false}
								instanceType={type}
								onSelect={onChange}
							/>
						))}
					</Stack>
				</Box>
			))}
		</Stack>
	);
}

interface InstanceTypeRowProps {
	selected: boolean;
	active: boolean;
	limited: boolean;
	restricted: boolean;
	instanceType: CloudInstanceType;
	onSelect: (slug: CloudInstanceType) => void;
}

function InstanceTypeRow({
	selected,
	active,
	limited,
	restricted,
	instanceType,
	onSelect,
}: InstanceTypeRowProps) {
	const hourlyPriceThousandth = instanceType?.price_hour ?? 0;
	const estimatedCost = hourlyPriceThousandth / 1000;
	const kind = instanceType.category === "free" ? "free" : "paid";

	return (
		<Paper
			p="lg"
			variant={active ? "gradient" : selected ? "selected" : "interactive"}
			onClick={() => !active && onSelect(instanceType)}
		>
			<Group>
				<Box flex={1}>
					<Group gap="sm">
						<Text
							c="bright"
							fw={500}
							fz="xl"
						>
							{instanceType.display_name}
						</Text>
						{active ? (
							<Badge
								size="sm"
								variant="light"
							>
								Active
							</Badge>
						) : restricted ? (
							<LockAlert label="You need to upgrade to use paid instances" />
						) : (
							limited && (
								<LockAlert
									label={`You have reached the limit of ${kind} instances`}
								/>
							)
						)}
					</Group>
					{estimatedCost > 0 ? (
						<Text mt={2}>{CURRENCY_FORMAT.format(estimatedCost)} per hour</Text>
					) : (
						<Text
							fz="sm"
							mt={2}
						>
							No usage costs
						</Text>
					)}
				</Box>
				<Box
					w={96}
					ta="center"
				>
					<Text
						fz="lg"
						fw={500}
						c="bright"
					>
						{instanceType.cpu} Core
					</Text>
					<Label
						mt={2}
						c="slate.3"
					>
						vCPU
					</Label>
				</Box>
				<Divider orientation="vertical" />
				<Box
					w={96}
					ta="center"
				>
					<Text
						fz="lg"
						fw={500}
						c="bright"
					>
						{formatMemory(instanceType.memory)}
					</Text>
					<Label
						mt={2}
						c="slate.3"
					>
						Memory
					</Label>
				</Box>
			</Group>
		</Paper>
	);
}

function LockAlert({ label }: { label: string }) {
	return (
		<Tooltip label={label}>
			<div>
				<Icon
					path={iconAuth}
					mt={-2}
				/>
			</div>
		</Tooltip>
	);
}
