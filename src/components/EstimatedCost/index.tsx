import { Box, Text } from "@mantine/core";
import { Label } from "~/components/Label";
import { useIsLight } from "~/hooks/theme";
import type { CloudInstanceType } from "~/types";

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
			<Label>Estimated costs</Label>

			<Text c={isLight ? "slate.6" : "slate.2"}>
				<Text
					span
					fz={24}
					fw={500}
					c="bright"
				>
					${estimatedCost.toFixed(3)}
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
					${(estimatedCost * 24 * 30).toFixed(3)}
				</Text>
				/month
			</Text>
		</Box>
	);
}
