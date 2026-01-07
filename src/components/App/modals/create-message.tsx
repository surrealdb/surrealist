import {
	Alert,
	Button,
	Checkbox,
	Group,
	Modal,
	NumberInput,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useInputState } from "@mantine/hooks";
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { useConversationCreateMutation, useCreateTicketMutation } from "~/cloud/mutations/context";
import { useCloudOrganizationTicketAttributesQuery } from "~/cloud/queries/context";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { useOrganisationsWithSupportPlanQuery } from "~/cloud/queries/support";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { SALES_ENQUIRY_TAG } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useIntent } from "~/hooks/routing";
import { IntercomTicketTypeAttribute } from "~/types";
import { iconChat, iconComment, iconCursor, iconHelp, iconTag, iconWarning } from "~/util/icons";

const CONVERSATION_TYPES = [
	{
		id: "sales-enquiry",
		header: "Sales enquiry",
		tags: [SALES_ENQUIRY_TAG],
	},
	{
		id: "general",
		header: "Account / billing enquiry",
		tags: [],
	},
];

export function CreateMessageModal() {
	const [isOpen, openedHandle] = useBoolean();
	const [isTicket, setIsTicket] = useInputState(false);
	const [organisation, setOrganisation] = useInputState<string | undefined>(undefined);

	const { data: organisations } = useCloudOrganizationsQuery();
	const { data: organisationsWithSupportPlan } = useOrganisationsWithSupportPlanQuery(
		organisations,
		true,
	);
	const { data: ticketAttributes } = useCloudOrganizationTicketAttributesQuery(organisation);

	const createTicketMutation = useCreateTicketMutation(organisation);
	const createConversationMutation = useConversationCreateMutation();

	const [name, setName] = useInputState<string>("");
	const [description, setDescription] = useInputState<string>("");
	const [attributes, setAttributes] = useInputState<Record<string, any>>({});
	const [conversationType, setConversationType] = useInputState<string>("general");

	const hasTicketsAccess =
		organisationsWithSupportPlan && organisationsWithSupportPlan.length > 0;
	const canSubmit =
		name &&
		description &&
		(!isTicket || (isTicket && organisation)) &&
		(!isTicket ||
			(isTicket &&
				organisationsWithSupportPlan &&
				organisationsWithSupportPlan.length > 0)) &&
		(!isTicket ||
			ticketAttributes
				?.filter(
					(it) =>
						it.required &&
						!["organisation", "organization"].includes(it.name.toLowerCase()),
				)
				.every((it) => attributes[it.name]));

	const isPending = createTicketMutation.isPending || createConversationMutation.isPending;

	const handleClose = () => {
		openedHandle.close();
		setIsTicket(false);
		setAttributes({});
		setName("");
		setDescription("");
		setConversationType("general");
	};

	useIntent("create-message", ({ type, organisation, subject, message, conversationType }) => {
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

		if (conversationType) {
			setConversationType(conversationType);
		}

		openedHandle.open();
	});

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
					<PrimaryTitle>
						{isTicket
							? "Create new ticket"
							: (CONVERSATION_TYPES.find((it) => it.id === conversationType)
									?.header ?? "General enquiry")}
					</PrimaryTitle>
				</Group>
			}
			onClose={handleClose}
		>
			<Form
				onSubmit={async () => {
					if (!isPending && canSubmit) {
						if (isTicket) {
							const result = await createTicketMutation.mutateAsync({
								name: name,
								description: description,
								attributes: attributes,
							});

							console.log(result);

							handleClose();
							navigate(`/support/conversations/${result.id}`);
						} else {
							const result = await createConversationMutation.mutateAsync({
								body: description,
								subject: name,
								tags:
									CONVERSATION_TYPES.find((it) => it.id === conversationType)
										?.tags ?? [],
							});

							console.log(result);

							handleClose();
							navigate(`/support/conversations/${result.id}`);
						}
					}
				}}
			>
				<Stack gap="xl">
					{(!isTicket || hasTicketsAccess) && (
						<Alert
							title="Please note"
							color="violet"
							icon={<Icon path={iconComment} />}
						>
							Replies will be sent here and to your email address.
						</Alert>
					)}
					{isTicket && !hasTicketsAccess && (
						<Alert
							title="You are unable to create a support ticket"
							color="violet"
							icon={<Icon path={iconWarning} />}
						>
							<Stack>
								You are not associated with any organisations that has a support
								plan or you do not have admin access to one that does.
								<div>
									<Button
										color="violet"
										variant="light"
										size="xs"
										onClick={() => {
											navigate("/organisations?destination=support-plans");
											openedHandle.close();
										}}
									>
										View plans
									</Button>
								</div>
							</Stack>
						</Alert>
					)}
					{(!isTicket || hasTicketsAccess) && (
						<>
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
						</>
					)}
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
					{isTicket &&
						ticketAttributes
							?.filter(
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
					{(!isTicket || hasTicketsAccess) && (
						<Group>
							<Group
								gap="xs"
								wrap="nowrap"
							>
								<Icon path={iconHelp} />
								<Text>Include attachments by sending a reply to this thread</Text>
							</Group>
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
					)}
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
