import { Box, Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import type { CloudInstanceType } from "~/types";
import { CURRENCY_FORMAT } from "~/util/helpers";

export interface EstimatedCostProps {
	type?: CloudInstanceType;
	units?: number;
}

export function EstimatedCost({ type, units }: EstimatedCostProps) {
	const isLight = useIsLight();
	const hourlyPriceThousandth = type?.price_hour ?? 0;
	const estimatedCost = (hourlyPriceThousandth / 1000) * (units ?? 0);

	return (
		<Box style={{ WebkitUserSelect: "text", userSelect: "text" }}>
			<Text c={isLight ? "slate.6" : "slate.2"}>
				<Text
					span
					fz={24}
					fw={500}
					c="bright"
				>
					{CURRENCY_FORMAT.format(estimatedCost)}
				</Text>
				/hour
			</Text>

			<Text c={isLight ? "slate.6" : "slate.2"}>
				≈{" "}
				<Text
					span
					fw={500}
					c="bright"
				>
					{CURRENCY_FORMAT.format(estimatedCost * 24 * 30)}
				</Text>
				/month
			</Text>
		</Box>
	);
}
