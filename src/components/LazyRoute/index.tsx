import { useDisclosure } from "@mantine/hooks";
import { type FC, Suspense, useLayoutEffect, useState } from "react";
import { createHtmlPortalNode, InPortal, OutPortal } from "react-reverse-portal";
import { type PathPattern, Route } from "wouter";

const PORTAL_OPTIONS = {
	attributes: {
		style: "height: 100%; display: flex; flex-direction: column;",
	},
};

export interface LazyRouteProps {
	path: PathPattern;
	disabled?: boolean;
	component: FC;
}

export function LazyRoute({ path, disabled, component }: LazyRouteProps) {
	const [node] = useState(() => createHtmlPortalNode(PORTAL_OPTIONS));
	const [isLoaded, loadedHandle] = useDisclosure();

	const Component = component;

	return (
		<>
			<InPortal node={node}>
				{isLoaded && (
					<Suspense fallback={null}>
						<Component />
					</Suspense>
				)}
			</InPortal>
			<Route path={path}>
				<LazyRouteInner
					node={node}
					loaded={loadedHandle.open}
				/>
			</Route>
		</>
	);
}

interface LazyRouteInnerProps {
	node: any;
	loaded: () => void;
}

function LazyRouteInner({ node, loaded }: LazyRouteInnerProps) {
	useLayoutEffect(loaded, []);

	return <OutPortal node={node} />;
}
