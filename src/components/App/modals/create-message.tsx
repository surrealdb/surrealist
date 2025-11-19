import {
	Alert,
	Button,
	Checkbox,
	Group,
	Modal,
	NumberInput,
	Select,
	Stack,
	Textarea,
	TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useInputState } from "@mantine/hooks";
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { useConversationCreateMutation, useCreateTicketMutation } from "~/cloud/mutations/context";
import { useCloudTicketTypesQuery } from "~/cloud/queries/context";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { useOrganisationsWithSupportPlanQuery } from "~/cloud/queries/support";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useIntent } from "~/hooks/routing";
import { IntercomTicketTypeAttribute } from "~/types";
import {
	iconBullhorn,
	iconChat,
	iconComment,
	iconCursor,
	iconTag,
	iconWarning,
} from "~/util/icons";

export function CreateMessageModal() {
	const [isOpen, openedHandle] = useBoolean();
	const [isTicket, setIsTicket] = useInputState(false);
	const [organisation, setOrganisation] = useInputState<string | undefined>(undefined);
	const [ticketType, setTicketType] = useInputState<string | null>(null);
	const [availableAttributes, setAvailableAttributes] = useInputState<
		IntercomTicketTypeAttribute[]
	>([]);

	const { data: organisations } = useCloudOrganizationsQuery();
	const { data: organisationsWithSupportPlan } = useOrganisationsWithSupportPlanQuery(
		organisations,
		true,
	);

	const createTicketMutation = useCreateTicketMutation(organisation);
	const createConversationMutation = useConversationCreateMutation();

	const typesQuery = useCloudTicketTypesQuery();

	const [name, setName] = useInputState<string>("");
	const [description, setDescription] = useInputState<string>("");
	const [attributes, setAttributes] = useInputState<Record<string, any>>({});

	const canSubmit =
		name &&
		description &&
		(!isTicket || (isTicket && organisation)) &&
		(!isTicket || (isTicket && ticketType)) &&
		(!isTicket ||
			(isTicket &&
				organisationsWithSupportPlan &&
				organisationsWithSupportPlan.length > 0)) &&
		availableAttributes
			.filter(
				(it) =>
					it.required &&
					!["organisation", "organization"].includes(it.name.toLowerCase()),
			)
			.every((it) => attributes[it.name]);

	const isPending = createTicketMutation.isPending || createConversationMutation.isPending;

	const handleClose = () => {
		openedHandle.close();
		setIsTicket(false);
		setTicketType(null);
		setAttributes({});
		setName("");
		setDescription("");
		setOrganisation(undefined);
		setAvailableAttributes([]);
	};

	useIntent("create-message", ({ type, organisation, subject, message }) => {
		if (type === "ticket") {
			setIsTicket(true);
		} else {
			setIsTicket(false);
		}

		if (organisation) {
			setOrganisation(organisation);
		}

		if (subject) {
			setName(subject);
		}

		if (message) {
			setDescription(message);
		}

		openedHandle.open();
	});

	useEffect(() => {
		if (typesQuery.data && typesQuery.data.length === 1) {
			setTicketType(typesQuery.data[0].id);
		}

		const ticket = typesQuery.data?.find((it) => it.id === ticketType);

		if (ticket) {
			setAvailableAttributes(ticket.attributes.filter((it) => it.visible_on_create));
		}
	}, [ticketType, typesQuery.data]);

	useEffect(() => {
		if (
			organisations &&
			organisationsWithSupportPlan &&
			organisationsWithSupportPlan.length === 1
		) {
			setOrganisation(organisationsWithSupportPlan[0].id);
		}
	}, [organisations, organisationsWithSupportPlan]);

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
				onSubmit={async () => {
					if (!isPending && canSubmit) {
						if (isTicket && ticketType) {
							const nonFileAttributes = Object.entries(attributes)
								.filter(([_, value]) => !(value instanceof File))
								.reduce(
									(acc, [key, value]) => {
										acc[key] = value;
										return acc;
									},
									{} as Record<string, any>,
								);

							const result = await createTicketMutation.mutateAsync({
								type: parseInt(ticketType),
								name: name,
								description: description,
								attributes: {
									...nonFileAttributes,
								},
							});

							handleClose();
							navigate(`/support/conversations/${result.id}`);
						} else if (!isTicket) {
							const result = await createConversationMutation.mutateAsync({
								body: description,
								subject: name,
							});

							handleClose();
							navigate(`/support/conversations/${result.id}`);
						}
					}
				}}
			>
				<Stack gap="xl">
					{!isTicket && (
						<Alert
							title="Please note"
							color="violet"
							icon={<Icon path={iconComment} />}
						>
							Conversations should only be used for billing & account issues as well
							as sales inquiries
						</Alert>
					)}
					{isTicket &&
						(!organisationsWithSupportPlan ||
							organisationsWithSupportPlan.length === 0) && (
							<Alert
								title="You are unable to create a support ticket"
								color="red"
								icon={<Icon path={iconWarning} />}
							>
								You are not associated with any organisations that has a support
								plan or you do not have admin access to one that does.
							</Alert>
						)}
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
						label="What is your reason for contacting us?"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					{isTicket &&
						organisationsWithSupportPlan &&
						organisationsWithSupportPlan.length > 0 && (
							<Select
								required
								data={
									organisationsWithSupportPlan?.map((it) => ({
										value: it.id,
										label: it.name,
									})) || []
								}
								label="Organisation"
								placeholder="Please select the associated organisation"
								value={organisation}
								onChange={setOrganisation}
							/>
						)}
					{isTicket && typesQuery.data && typesQuery.data.length > 1 && (
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
					{availableAttributes
						.filter(
							(attr) =>
								attr.visible_on_create &&
								!["organisation"].includes(attr.name.toLowerCase()),
						)
						.sort((a, b) => a.order - b.order)
						.map((attr) => (
							<TicketAttribute
								key={attr.name}
								attr={attr}
								value={attributes[attr.name]}
								onChange={(value) =>
									setAttributes({ ...attributes, [attr.name]: value })
								}
							/>
						))}
					<Group>
						<Spacer />
						<Button
							loading={isPending}
							type="submit"
							variant="gradient"
							rightSection={<Icon path={iconCursor} />}
							disabled={!canSubmit || isPending}
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

	return undefined;
}
