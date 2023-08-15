import { Alert } from "@mantine/core";
import { mdiInformation } from "@mdi/js";
import { Icon } from "../Icon";

export interface InheritAlertProps {
	visible: boolean;
	environment: string | undefined;
}

export function InheritAlert({ visible, environment }: InheritAlertProps) {
	return (
		<div
			style={{
				transition: "height .2s",
				height: visible ? 64 : 0,
				overflow: "hidden",
			}}>
			<Alert mb="lg" color="blue" icon={<Icon path={mdiInformation} />}>
				Empty fields are inherited from the environment {environment ? <b>{environment}</b> : ""}
			</Alert>
		</div>
	);
}
