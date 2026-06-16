import { ActionIcon, CopyButton, TextInput } from "@mantine/core";
import { Icon, iconCheck, iconCopy } from "@surrealdb/ui";

export interface CopyableFieldProps {
	label: string;
	description?: string;
	value: string;
}

export function CopyableField({ label, description, value }: CopyableFieldProps) {
	return (
		<TextInput
			maw={400}
			label={label}
			description={description}
			value={value}
			readOnly
			rightSection={
				<CopyButton value={value}>
					{({ copied, copy }) => (
						<ActionIcon
							variant={copied ? "gradient" : undefined}
							aria-label={`Copy ${label}`}
							radius="xs"
							size="md"
							onClick={copy}
						>
							<Icon path={copied ? iconCheck : iconCopy} />
						</ActionIcon>
					)}
				</CopyButton>
			}
			styles={{
				input: {
					fontFamily: "var(--mantine-font-family-monospace)",
				},
			}}
		/>
	);
}
