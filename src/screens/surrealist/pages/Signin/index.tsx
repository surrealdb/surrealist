import { useEffect } from "react";
import { useCloudInstanceList } from "~/cloud/hooks/instances";
import { AuthGuard } from "~/components/AuthGuard";
import { useCloudProfile } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";

export function SigninPage() {
	const { entries, isPending } = useCloudInstanceList();
	const [, navigate] = useAbsoluteLocation();
	const { default_org } = useCloudProfile();

	useEffect(() => {
		if (!isPending) return;

		const hasInstances = !entries.some((entry) => entry.instances.length > 0);

		if (hasInstances && default_org) {
			navigate(`/o/${default_org}/deploy`);
		} else {
			navigate("/overview");
		}
	}, [entries, isPending, default_org]);

	return <AuthGuard loading />;
}

export default SigninPage;
