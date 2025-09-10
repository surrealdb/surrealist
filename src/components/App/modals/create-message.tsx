import {
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
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useIntent } from "~/hooks/routing";
import { IntercomTicketTypeAttribute } from "~/types";
import { iconBullhorn, iconChat, iconCursor, iconTag } from "~/util/icons";

export function CreateMessageModal() {
	const [isOpen, openedHandle] = useBoolean();
	const [isTicket, setIsTicket] = useInputState(false);
	const [organisation, setOrganisation] = useInputState<string | undefined>(undefined);
	const [ticketType, setTicketType] = useInputState<string | null>(null);
	const [availableAttributes, setAvailableAttributes] = useInputState<
		IntercomTicketTypeAttribute[]
	>([]);

	const { data: organisations } = useCloudOrganizationsQuery();

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
		setAvailableAttributes([]);
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
							// const fileEntries = Object.entries(attributes).filter(
							// 	([_, value]) => value instanceof File,
							// );

							// const fileAttributes = await Promise.all(
							// 	fileEntries.map(async ([key, value]) => {
							// 		const reader = new FileReader();

							// 		return new Promise<{ [key: string]: any }>((resolve) => {
							// 			reader.onload = () => {
							// 				resolve({
							// 					[key]: [
							// 						{
							// 							content_type: value.type,
							// 							name: value.name,
							// 							data: reader.result,
							// 						},
							// 					],
							// 				});
							// 			};
							// 			reader.readAsDataURL(value);
							// 		});
							// 	}),
							// );

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
									// ...Object.fromEntries(
									// 	fileAttributes.map((attr) => Object.entries(attr)[0]),
									// ),
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
							required
							data={
								organisations?.map((it) => ({
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

	// NOTE: Intercom doesn't support files via the API yet for creation. Hide for now.
	// if (attr.data_type === "files") {
	// 	return (
	// 		<FileInput
	// 			label={attr.name}
	// 			description={attr.description}
	// 			required={attr.required}
	// 			value={value}
	// 			multiple={attr.input_options?.allow_multiple_values ?? false}
	// 			onChange={onChange}
	// 		/>
	// 	);
	// }

	return undefined;
}
