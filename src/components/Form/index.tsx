import { Box, BoxProps } from "@mantine/core";
import { PropsWithChildren } from "react";
import { useStable } from "~/hooks/stable";

export interface FormProps extends BoxProps {
	onSubmit: () => void;
}

export function Form({
	onSubmit,
	children,
	...other
}: PropsWithChildren<FormProps>) {
	const doSubmit = useStable((e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		onSubmit();
	});

	return (
		<Box
			component="form"
			onSubmit={doSubmit}
			{...other}
		>
			{children}
		</Box>
	);
}
