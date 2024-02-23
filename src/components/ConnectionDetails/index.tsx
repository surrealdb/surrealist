
import { ConnectionOptions } from "~/types";
import { Updater } from "use-immer";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useDisclosure } from "@mantine/hooks";

export interface ConnectionDetailsProps {
	value: ConnectionOptions;
	onChange: Updater<ConnectionOptions>;
}

export function ConnectionDetails({ value, onChange }: ConnectionDetailsProps) {
	const isLight = useIsLight();

	const [editingScope, editingScopeHandle] = useDisclosure();

	const addScopeField = useStable(() => {
		onChange((draft) => {
			draft.scopeFields.push({
				subject: "",
				value: "",
			});
		});
	});

	return (
		<>
			
		</>
	);
}
