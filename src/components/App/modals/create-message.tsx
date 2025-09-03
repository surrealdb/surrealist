import {
	Button,
	Checkbox,
	FileInput,
	Group,
	Modal,
	MultiSelect,
	NumberInput,
	Select,
	Stack,
	TagsInput,
	Textarea,
	TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useInputState } from "@mantine/hooks";
import { useEffect } from "react";
import { useCloudTicketTypesQuery } from "~/cloud/queries/context";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useIntent } from "~/hooks/routing";
import { IntercomTicketTypeAttribute } from "~/types";
import { EMAIL_REGEX } from "~/util/helpers";
import { iconBullhorn, iconChat, iconCursor, iconTag } from "~/util/icons";

export function CreateMessageModal() {
	const [isOpen, openedHandle] = useBoolean();
	const [isTicket, setIsTicket] = useInputState(false);
	const [organisation, _setOrganisation] = useInputState<string | undefined>(undefined);
	const [ticketType, setTicketType] = useInputState<string | null>(null);
	const [availableAttributes, setAvailableAttributes] = useInputState<
		IntercomTicketTypeAttribute[]
	>([]);

	const { data: organisations, isPending: organisationsPending } = useCloudOrganizationsQuery();
	const { data: members, isPending: membersPending } = useCloudMembersQuery(organisation);

	const typesQuery = useCloudTicketTypesQuery();

	const [isContactsValid, setIsContactsValid] = useInputState(false);

	const [name, setName] = useInputState<string>("");
	const [description, setDescription] = useInputState<string>("");
	const [orgContacts, setOrgContacts] = useInputState<string[]>([]);
	const [additionalContacts, setAdditionalContacts] = useInputState<string[]>([]);
	const [attributes, setAttributes] = useInputState<Record<string, any>>({});

	const canSubmit =
		(additionalContacts.length === 0 || isContactsValid) &&
		name &&
		description &&
		availableAttributes.filter((it) => it.required).every((it) => attributes[it.id]);

	const handleClose = () => {
		openedHandle.close();
		setIsTicket(false);
		setTicketType(null);
		setAvailableAttributes([]);
		setOrgContacts([]);
	};

	useIntent("create-message", ({ type }) => {
		if (type === "ticket") {
			setIsTicket(true);
		} else {
			setIsTicket(false);
		}

		openedHandle.open();
	});

	useEffect(() => {
		const ticket = typesQuery.data?.find((it) => it.id === ticketType);

		if (ticket) {
			setAvailableAttributes(ticket.attributes.filter((it) => it.visible_on_create));
		}
	}, [ticketType, typesQuery.data]);

	useEffect(() => {
		setIsContactsValid(additionalContacts.every((contact) => EMAIL_REGEX.test(contact)));
	}, [additionalContacts]);

	return (
		<Modal
			size="lg"
			withCloseButton
			opened={isOpen}
			title={
				<Group>
					<Icon path={isTicket ? iconTag : iconChat} />
					<PrimaryTitle>Create new {isTicket ? "ticket" : "conversation"}</PrimaryTitle>
				</Group>
			}
			onClose={handleClose}
		>
			<Form
				onSubmit={() => {
					if (canSubmit) {
						// do submit
					}
				}}
			>
				<Stack gap="xl">
					<TextInput
						required
						label="Subject"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<Textarea
						autosize
						required
						minRows={5}
						label="Describe your issue"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					{isTicket && (
						<Select
							data={
								typesQuery.data?.map((it) => {
									return {
										value: it.id,
										label: it.name,
									};
								}) || []
							}
							required
							label="Ticket type"
							placeholder="Please select ticket type"
							leftSection={<Icon path={iconBullhorn} />}
							value={ticketType}
							onChange={setTicketType}
							flex={1}
						/>
					)}
					{organisation && members && members.length > 0 && (
						<MultiSelect
							flex={1}
							data={members.map((it) => ({
								value: it.user_id,
								label: `${it.name}`,
							}))}
							label="Organisation contacts"
							placeholder="Add additional contacts to this ticket from the associated organisation"
							value={orgContacts}
							onChange={setOrgContacts}
						/>
					)}
					<TagsInput
						label="Additional contacts"
						placeholder="Add additional contacts by their emails"
						error={
							isContactsValid
								? undefined
								: "Only emails separated by a comma are allowed"
						}
						styles={{
							pillsList: {
								width: "100%",
							},
						}}
						value={additionalContacts}
						onChange={setAdditionalContacts}
					/>
					{availableAttributes
						.filter((attr) => attr.visible_on_create)
						.sort((a, b) => a.order - b.order)
						.map((attr) => (
							<TicketAttribute
								key={attr.id}
								attr={attr}
								value={attributes[attr.id]}
								onChange={(value) =>
									setAttributes({ ...attributes, [attr.id]: value })
								}
							/>
						))}
					<Group mt="xl">
						<Spacer />
						<Button
							type="submit"
							variant="gradient"
							rightSection={<Icon path={iconCursor} />}
							// loading={ticketCreateMutation.isPending}
							disabled={!canSubmit}
						>
							Submit
						</Button>
					</Group>
				</Stack>
			</Form>
		</Modal>
	);
}

interface TicketAttributeProps {
	attr: IntercomTicketTypeAttribute;
	value: any;
	onChange: (value: any) => void;
}

function TicketAttribute({ attr, value, onChange }: TicketAttributeProps) {
	if (attr.data_type === "list") {
		const values =
			attr.input_options?.list_options
				?.filter((it) => !it.archived)
				?.map((it) => ({
					value: it.id,
					label: it.label,
				})) || [];

		return (
			<Select
				data={values}
				description={attr.description}
				label={attr.name}
				required={attr.required}
				onChange={onChange}
			/>
		);
	}

	if (attr.data_type === "string") {
		if (attr.input_options?.multiline) {
			return (
				<Textarea
					label={attr.name}
					description={attr.description}
					required={attr.required}
					value={value}
					autosize
					minRows={5}
					onChange={onChange}
				/>
			);
		}

		return (
			<TextInput
				label={attr.name}
				description={attr.description}
				required={attr.required}
				value={value}
				onChange={onChange}
			/>
		);
	}

	if (attr.data_type === "integer") {
		return (
			<NumberInput
				label={attr.name}
				description={attr.description}
				required={attr.required}
				allowDecimal={false}
				value={value}
				onChange={onChange}
			/>
		);
	}

	if (attr.data_type === "decimal") {
		return (
			<NumberInput
				label={attr.name}
				description={attr.description}
				required={attr.required}
				allowDecimal
				value={value}
				onChange={onChange}
			/>
		);
	}

	if (attr.data_type === "datetime") {
		return (
			<DateTimePicker
				label={attr.name}
				description={attr.description}
				required={attr.required}
				value={value}
				onChange={onChange}
			/>
		);
	}

	if (attr.data_type === "boolean") {
		return (
			<Checkbox
				variant="gradient"
				label={attr.name}
				description={attr.description}
				required={attr.required}
				checked={value}
				onChange={(e) => onChange(e.currentTarget.checked)}
			/>
		);
	}

	if (attr.data_type === "files") {
		return (
			<FileInput
				label={attr.name}
				description={attr.description}
				required={attr.required}
				value={value}
				multiple={attr.input_options?.allow_multiple_values ?? false}
				onChange={onChange}
			/>
		);
	}

	return undefined;
}
