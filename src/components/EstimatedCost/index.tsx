import { Box, BoxProps, Group, Text } from "@mantine/core";
import { useMemo } from "react";
import { useCloudEstimationQuery } from "~/cloud/queries/estimation";
import type { CloudDeployConfig, CloudOrganization } from "~/types";
import { CURRENCY_FORMAT } from "~/util/helpers";

export interface EstimatedCostProps extends BoxProps {
	organisation: CloudOrganization;
	config: CloudDeployConfig;
}

export function EstimatedCost({ organisation, config, ...other }: EstimatedCostProps) {
	const { data } = useCloudEstimationQuery(organisation, config);

	const format = useMemo(() => {
		// return new Intl.NumberFormat("en-US", {
		// 	style: "currency",
		// 	currency: data?.currency ?? "USD",
		// 	currencyDisplay: "narrowSymbol",
		// 	maximumFractionDigits: 3,
		// });
		return CURRENCY_FORMAT;
	}, []);

	return (
		<Box {...other}>
			<Text
				c="var(--mantine-color-indigo-light-color)"
				fz="md"
				fw={800}
				tt="uppercase"
				lts={1}
			>
				Billed monthly
			</Text>
			<Group
				gap="xs"
				align="start"
			>
				{data ? (
					<Text
						fz={28}
						fw={600}
						c="bright"
					>
						{format.format(data.cost / 1000)}
					</Text>
				) : (
					<Text
						fz={28}
						fw={600}
					>
						&mdash;
					</Text>
				)}
				<Text
					mt={12}
					fz="xl"
					fw={500}
				>
					/ mo
				</Text>
			</Group>
		</Box>
	);
}
