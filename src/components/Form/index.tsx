import { PropsWithChildren } from "react";
import { useStable } from "~/hooks/stable";

export interface FormProps {
	onSubmit: () => void;
}

export function Form(props: PropsWithChildren<FormProps>) {
	const doSubmit = useStable((e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		props.onSubmit();
	});

	return <form onSubmit={doSubmit}>{props.children}</form>;
}
