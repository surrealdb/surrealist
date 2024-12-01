import { Box, Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import type { CloudInstanceType } from "~/types";

export interface EstimatedCostProps {
	type: CloudInstanceType;
	units: number;
}

export function EstimatedCost({ type, units }: EstimatedCostProps) {
	const isLight = useIsLight();
	const hourlyPriceThousandth = type.price_hour ?? 0;
	const estimatedCost = (hourlyPriceThousandth / 1000) * units;

	return (
		<Box>
			<Text
				fz="xl"
				fw={500}
				mt="xl"
				c={isLight ? "slate.7" : "slate.2"}
			>
				Estimated costs
			</Text>

			<Text
				fz={13}
				c={isLight ? "slate.6" : "slate.2"}
			>
				<Text
					span
					ml={4}
					fz={22}
					fw={500}
					c="bright"
				>
					${estimatedCost.toFixed(3)}
				</Text>
				/hour
			</Text>

			<Text
				fz={13}
				c={isLight ? "slate.6" : "slate.2"}
			>
				Approx.
				<Text
					span
					ml={4}
					fw={500}
					c="bright"
				>
					${(estimatedCost * 24 * 30).toFixed(3)}
				</Text>
				/month
			</Text>
		</Box>
	);
}
