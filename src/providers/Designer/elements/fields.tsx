import { Accordion, Checkbox, Flex, Text, TextInput } from "@mantine/core";
import { iconJSON } from "@surrealdb/ui";
import { CodeInput, FieldKindInput, PermissionInput } from "~/components/Inputs";
import { useStable } from "~/hooks/stable";
import type { SchemaField } from "~/types";
import { type ElementProps, SectionTitle } from "../helpers";
import { Lister } from "../lister";
import classes from "../style.module.scss";

export function FieldsElement({ data, setData }: ElementProps) {
	const initField = useStable(() => ({
		name: "",
		assert: "",
		flex: false,
		readonly: false,
		kind: "",
		value: "",
		default: "",
		permissions: {
			create: true,
			select: true,
			update: true,
			delete: true,
		},
	}));

	const renderField = useStable((field: SchemaField) => (
		<Flex>
			{field.name}
			{field.kind && (
				<>
					<Text
						c="obsidian"
						mr="xs"
					>
						:
					</Text>
					<Text className={classes.kind}>{field.kind}</Text>
				</>
			)}
		</Flex>
	));

	const handleChange = useStable((fields: SchemaField[]) => {
		setData((draft) => {
			draft.fields = fields;
		});
	});

	return (
		<Accordion.Item value="fields">
			<SectionTitle icon={iconJSON}>Fields</SectionTitle>
			<Accordion.Panel>
				<Lister
					value={data.fields}
					missing="No schema fields defined yet"
					name="field"
					onChange={handleChange}
					factory={initField}
					display={renderField}
				>
					{(field, setField, isCreating) => (
						<>
							<TextInput
								required
								autoFocus
								label="Field name"
								placeholder="field_name"
								disabled={!isCreating}
								spellCheck={false}
								value={field.name}
								onChange={(e) =>
									setField((draft) => {
										draft.name = e.target.value;
									})
								}
							/>
							<Checkbox
								label="Flexible"
								checked={field.flex}
								onChange={(e) =>
									setField((draft) => {
										draft.flex = e.target.checked;
									})
								}
							/>
							<Checkbox
								label="Readonly"
								checked={field.readonly}
								onChange={(e) =>
									setField((draft) => {
										draft.readonly = e.target.checked;
									})
								}
							/>
							<FieldKindInput
								label="Field kind"
								value={field.kind || ""}
								onChange={(value) =>
									setField((draft) => {
										draft.kind = value || "";
									})
								}
							/>
							<CodeInput
								label="Field value"
								value={field.value || ""}
								onChange={(value) =>
									setField((draft) => {
										draft.value = value;
									})
								}
							/>
							<CodeInput
								label="Field assertion"
								value={field.assert || ""}
								onChange={(value) =>
									setField((draft) => {
										draft.assert = value;
									})
								}
							/>
							<CodeInput
								label="Default value"
								value={field.default || ""}
								onChange={(value) =>
									setField((draft) => {
										draft.default = value;
									})
								}
							/>
							<PermissionInput
								label="Create access"
								value={field.permissions.create}
								onChange={(value) =>
									setField((draft) => {
										draft.permissions.create = value;
									})
								}
							/>
							<PermissionInput
								label="Select access"
								value={field.permissions.select}
								onChange={(value) =>
									setField((draft) => {
										draft.permissions.select = value;
									})
								}
							/>
							<PermissionInput
								label="Update access"
								value={field.permissions.update}
								onChange={(value) =>
									setField((draft) => {
										draft.permissions.update = value;
									})
								}
							/>
						</>
					)}
				</Lister>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
