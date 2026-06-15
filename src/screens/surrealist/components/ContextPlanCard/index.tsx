import { ReactNode } from "react";
import { ContextPackage } from "~/types";
import { PlanCard } from "../PlanCard";

function contextPackageFeatures(pkg: ContextPackage) {
	return [
		`${pkg.token_limit.toLocaleString()} tokens`,
		`Up to ${pkg.contexts_limit} context${pkg.contexts_limit !== 1 ? "s" : ""}`,
	];
}

export interface ContextPlanCardProps {
	pkg: ContextPackage;
	footer?: ReactNode;
}

export function ContextPlanCard({ pkg, footer }: ContextPlanCardProps) {
	const features = contextPackageFeatures(pkg);
	const pricePeriod = pkg.billing_period ?? "monthly";

	return (
		<PlanCard
			name={pkg.name}
			description={pkg.description}
			priceMillcents={pkg.cost_millcents}
			pricePeriod={pricePeriod}
			trialDays={pkg.trial_days}
			footer={footer}
			contents={[
				{
					label: "What you get",
					features: features,
				},
			]}
		/>
	);
}
