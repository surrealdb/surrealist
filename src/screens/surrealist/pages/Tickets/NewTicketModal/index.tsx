import { Button, Divider, Group, MultiSelect, Paper, Select, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { useCreateTicketMutation } from "~/cloud/mutations/tickets";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { useCloudTicketTypesQuery } from "~/cloud/queries/tickets";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useCloudProfile } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { showErrorNotification } from "~/util/helpers";
import { iconBullhorn, iconCursor, iconTag } from "~/util/icons";

export function openNewTicketModal(organization: string) {
    openModal({
        modalId: "new-org-ticket",
        size: "xl",
        title: (
            <Group>
                <Icon
                    path={iconTag}
                    size="xl"
                />
                <PrimaryTitle>Create ticket</PrimaryTitle>
            </Group>
        ),
        trapFocus: false,
        withCloseButton: true,
        children: (
            <NewTicketModal
                organization={organization}
            />
        ),
    });
}

interface NewTicketModalProps {
    organization: string;
}

function NewTicketModal({ organization }: NewTicketModalProps) {
    const profile = useCloudProfile();
    const ticketCreateMutation = useCreateTicketMutation(organization);
    const { data: ticketTypes, isPending: ticketTypesPending } = useCloudTicketTypesQuery(organization);
    const { data: members, isPending: membersPending } = useCloudMembersQuery(organization);

    const [type, setType] = useState<number>(0);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [additionalContacts, setAdditionalContacts] = useState<string[]>([]);

    const isLoading = ticketTypesPending || membersPending;
    const canSubmit = !isLoading && !!type && !!name && !!description;

    const handleClose = useStable(() => {
        closeModal("new-org-ticket");
    });

    const availableContacts = members?.filter((it) => it.username !== profile?.username && (it.role === "admin" || it.role === "owner")).map((it) => {
        return {
            value: it.username,
            label: it.name + " (" + it.username + ")"
        }
    }) || [];

    const handleSubmit = useStable(async () => {
        try {
            if (!canSubmit) {
                throw new Error("Please fill in all fields");
            }

            const response = await ticketCreateMutation.mutateAsync({
                type: type,
                name: name,
                description: description,
                contacts: additionalContacts,
            });

            if (response.id) {
                handleClose();
                navigate(`/t/${response.id}/o/${organization}`);
            } else {
                throw new Error("Failed to create ticket");
            }
        } catch (err) {
            showErrorNotification({
                title: "Ticket creation failed",
                content: err
            });
        }
    });

    return (
        <Form onSubmit={handleSubmit}>
            <Stack gap="xl">
                <TextInput
                    label="Ticket name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Textarea
                    autosize
                    minRows={5}
                    label="Describe your issue"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Group>
                    {availableContacts.length > 0 && (
                        <MultiSelect
                            flex={1}
                            data={availableContacts}
                            label="Additional contacts"
                            placeholder="Please select additional contacts"
                            value={additionalContacts}
                            onChange={setAdditionalContacts}
                        />
                    )}
                    <Select
                        data={(ticketTypes?.map((it) => {
                            return {
                                value: it.id,
                                label: it.name,
                            }
                        }) || [])}
                        label="Ticket type"
                        placeholder="Please select ticket type"
                        leftSection={<Icon path={iconBullhorn} />}
                        value={type.toString()}
                        onChange={setType as any}
                        flex={1}
                    />
                </Group>
                <Group mt="xl">
                    <Spacer />
                    <Button
                        type="submit"
                        variant="gradient"
                        rightSection={<Icon path={iconCursor} />}
                        loading={ticketCreateMutation.isPending}
                        disabled={!canSubmit}
                    >
                        Submit Ticket
                    </Button>
                </Group>
            </Stack>
        </Form>
    );
}
