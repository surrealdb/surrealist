import { type FC, Suspense, useLayoutEffect, useState } from "react";
import { createHtmlPortalNode, InPortal, OutPortal } from "react-reverse-portal";
import { useRoute } from "wouter";

const PORTAL_OPTIONS = {
	attributes: {
		style: "height: 100%; display: flex; flex-direction: column;",
	},
};

export interface LazyRouteProps {
	path: string;
	disabled?: boolean;
	component: FC;
}

export function LazyRoute({ path, disabled, component }: LazyRouteProps) {
	const [portal] = useState(() => createHtmlPortalNode(PORTAL_OPTIONS));
	const [isLoaded, setLoaded] = useState(false);
	const [matches] = useRoute(path);

	const Component = component;
	const isActive = !disabled && matches;

	useLayoutEffect(() => {
		if (isActive && !isLoaded) {
			setLoaded(true);
		}
	}, [isActive, isLoaded]);

	return (
		isLoaded && (
			<>
				<InPortal node={portal}>
					<Suspense fallback={null}>
						<Component />
					</Suspense>
				</InPortal>
				{isActive && <OutPortal node={portal} />}
			</>
		)
	);
}
