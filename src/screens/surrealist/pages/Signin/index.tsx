import { useEffect } from "react";
import { useCloudInstanceList } from "~/cloud/hooks/instances";
import { AuthGuard } from "~/components/AuthGuard";
import { useCloudProfile } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { withSearchParams } from "~/util/helpers";

export interface SigninPageProps {
	plan?: string;
}

export function SigninPage({ plan }: SigninPageProps) {
	const { entries, isPending } = useCloudInstanceList();
	const [, navigate] = useAbsoluteLocation();
	const { username, default_org } = useCloudProfile();

	useEffect(() => {
		if (isPending || !username) return;

		const hasInstances = entries.some((entry) => entry.instances.length > 0);

		if (plan === "explore") {
			navigate("/c/sandbox/query");
		} else if ((!hasInstances || plan) && default_org) {
			const target = withSearchParams(`/o/${default_org}/deploy`, {
				plan: plan === "deploy" ? undefined : plan,
			});

			navigate(target);
		} else {
			navigate("/overview");
		}
	}, [entries, isPending, default_org, username, plan]);

	return <AuthGuard loading />;
}

export default SigninPage;
