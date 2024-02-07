import {
	Modal,
	Stack,
	Paper,
	Group,
	TextInput,
	ActionIcon,
	Button,
	PasswordInput,
	Select,
	SimpleGrid,
	Text
} from "@mantine/core";

import { mdiClose, mdiPlus } from "@mdi/js";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { AUTH_MODES } from "~/constants";
import { AuthMode, ConnectionOptions } from "~/types";
import { Updater } from "use-immer";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { ModalTitle } from "../ModalTitle";
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
