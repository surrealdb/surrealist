import { useDisclosure } from "@mantine/hooks";
import { type FC, Suspense, useLayoutEffect } from "react";
import { InPortal, OutPortal } from "react-reverse-portal";
import { type PathPattern, Route } from "wouter";
import { usePortal } from "~/providers/PortalManager";

export interface LazyRouteProps {
	id: string;
	path: PathPattern;
	component: FC;
}

export function LazyRoute({ id, path, component }: LazyRouteProps) {
	const [isLoaded, loadedHandle] = useDisclosure();
	const Component = component;
	const node = usePortal(id, <Component />);

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
