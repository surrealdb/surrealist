import { Center, Loader } from "@mantine/core";
import { type PropsWithChildren } from "react";
import { AuthGuard, type AuthGuardProps } from "~/components/AuthGuard";
import { useCloud } from "~/providers/Cloud";

export interface CloudGuardProps extends AuthGuardProps {}

export function CloudGuard({ children, ...rest }: PropsWithChildren<CloudGuardProps>) {
	const { isActive } = useCloud();

	return (
		<AuthGuard {...rest}>
			{isActive ? (
				children
			) : (
				<Center flex={1}>
					<Loader size="lg" />
				</Center>
			)}
		</AuthGuard>
	);
}
