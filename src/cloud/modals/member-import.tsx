import {
	Badge,
	Box,
	type BoxProps,
	Button,
	Code,
	Group,
	InputLabel,
	Paper,
	Progress,
	ScrollArea,
	Select,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconFile, iconUpload } from "@surrealdb/ui";
import Papa from "papaparse";
import { capitalize } from "radash";
import { useMemo, useState } from "react";
import { adapter } from "~/adapter";
import { Form } from "~/components/Form";
import { CSV_FILTER } from "~/constants";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { EMAIL_REGEX, showInfo } from "~/util/helpers";
import { apiErrorMessage } from "../api";
import { normalizeRole } from "../helpers";
import { useInvitationMutation } from "../mutations/invites";
import { useCloudInvitationsQuery } from "../queries/invitations";
import { useCloudMembersQuery } from "../queries/members";
import { useCloudRolesQuery } from "../queries/roles";

const MODAL_ID = "import-members";

const EMAIL_HEADERS = ["email", "e-mail", "mail", "email address", "username"];
const ROLE_HEADERS = ["role", "roles", "permission"];

const EXAMPLE_CSV = ["email,role", "jane@example.com,admin", "john@example.com,member"].join("\n");

/** A single member as written in the imported CSV file. */
export interface CsvMember {
	/** The line the member was read from, for reporting problems back. */
	line: number;
	email: string;
	/** The role named by the file, if it named one. */
	role?: string;
}

/** An imported member resolved against the organisation, ready to be reviewed. */
export interface ImportRow extends CsvMember {
	/** The role as the Cloud API knows it, so restricted roles keep their prefix. */
	role: string;
	/** Why this row cannot be invited, when it cannot be. */
	issue?: string;
}

/** An address the API refused to invite, and the reason it gave. */
interface ImportFailure {
	email: string;
	message: string;
}

export interface ResolveOptions {
	/** The role names the organisation accepts. */
	roles: string[];
	/** The role given to rows that do not name one. */
	defaultRole: string;
	/** Emails that already belong to a member or a pending invitation. */
	taken: string[];
}

/**
 * Read a CSV file of members to invite. Files are matched on their header row,
 * accepting the column names other tools commonly export, and files without a
 * recognised header are read positionally so a bare list of addresses works
 * just as well.
 *
 * @param content The raw contents of the CSV file
 * @returns The members named by the file, in file order
 */
export function parseMemberCsv(content: string): CsvMember[] {
	const { data } = Papa.parse<string[]>(content.trim(), { skipEmptyLines: "greedy" });
	const header = (data[0] ?? []).map((cell) => cell.trim().toLowerCase());
	const emailColumn = header.findIndex((cell) => EMAIL_HEADERS.includes(cell));
	const roleColumn = header.findIndex((cell) => ROLE_HEADERS.includes(cell));

	// Without a header the first column holds the email and the second the role
	const hasHeader = emailColumn >= 0;
	const rows = hasHeader ? data.slice(1) : data;
	const emailIndex = hasHeader ? emailColumn : 0;
	const roleIndex = hasHeader ? roleColumn : 1;

	return rows.map((row, index) => {
		const role = roleIndex >= 0 ? (row[roleIndex] ?? "").trim() : "";

		return {
			line: index + (hasHeader ? 2 : 1),
			email: (row[emailIndex] ?? "").trim(),
			role: role || undefined,
		};
	});
}

/**
 * Resolve imported members against the organisation, filling in the default role
 * and flagging the rows that cannot be invited. Every row is returned so the
 * preview can show the file as it was written, problems included.
 *
 * @param members The members read from the CSV file
 * @param options The organisation's roles and existing members
 * @returns The resolved rows, in file order
 */
export function resolveMemberImport(members: CsvMember[], options: ResolveOptions): ImportRow[] {
	const taken = new Set(options.taken.map((email) => email.toLowerCase()));
	const seen = new Set<string>();

	return members.map((member) => {
		const email = member.email.toLowerCase();
		const named = (member.role ?? options.defaultRole).toLowerCase();

		// Roles may be written either as the API names them or in their
		// unrestricted form, which is how the team page presents them
		const resolved = options.roles.find(
			(role) => role.toLowerCase() === named || normalizeRole(role.toLowerCase()) === named,
		);

		const row = { ...member, role: resolved ?? named };

		if (!EMAIL_REGEX.test(email)) {
			return { ...row, issue: "Not a valid email address" };
		}

		if (taken.has(email)) {
			return { ...row, issue: "Already a member or invited" };
		}

		if (seen.has(email)) {
			return { ...row, issue: "Listed more than once" };
		}

		if (!resolved) {
			return { ...row, issue: `Unknown role "${named}"` };
		}

		seen.add(email);

		return row;
	});
}

export function openMemberImportModal(organization: CloudOrganization) {
	openModal({
		modalId: MODAL_ID,
		title: (
			<Group>
				<Icon path={iconUpload} />
				Import members
			</Group>
		),
		size: "lg",
		trapFocus: false,
		withCloseButton: true,
		children: <ImportModal organization={organization} />,
	});
}

export interface MemberImportPreviewProps extends BoxProps {
	/** The resolved rows to review, in file order. */
	rows: ImportRow[];
}

/**
 * Reviews the members read from a CSV file before they are invited, listing the
 * role each one will be given and the reason any of them will be skipped.
 */
export function MemberImportPreview({ rows, ...other }: MemberImportPreviewProps) {
	const invitable = rows.filter((row) => !row.issue);
	const skipped = rows.length - invitable.length;

	return (
		<Box {...other}>
			<Group
				gap="sm"
				mb="sm"
			>
				<Text
					fw={500}
					c="bright"
				>
					{rows.length} {rows.length === 1 ? "row" : "rows"} found
				</Text>
				<Badge
					variant="light"
					size="sm"
					color={invitable.length ? "surreal" : "slate"}
				>
					{invitable.length} to invite
				</Badge>
				{skipped > 0 && (
					<Badge
						variant="light"
						size="sm"
						color="orange"
					>
						{skipped} skipped
					</Badge>
				)}
			</Group>

			<Paper
				withBorder
				p="md"
			>
				<ScrollArea.Autosize mah={260}>
					<Table
						verticalSpacing="xs"
						horizontalSpacing={0}
					>
						<Table.Tbody>
							{rows.map((row) => (
								<Table.Tr key={row.line}>
									<Table.Td>
										<Text
											c={row.issue ? "orange" : "bright"}
											className="selectable"
										>
											{row.email || <i>No email address</i>}
										</Text>
									</Table.Td>
									<Table.Td
										w={1}
										style={{ whiteSpace: "nowrap" }}
									>
										{row.issue ? (
											<Badge
												variant="light"
												color="orange"
												size="sm"
												styles={{
													root: { float: "right" },
													label: { overflow: "visible" },
												}}
											>
												{row.issue}
											</Badge>
										) : (
											<Badge
												variant="light"
												size="sm"
												styles={{
													root: { float: "right" },
													label: { overflow: "visible" },
												}}
											>
												{normalizeRole(row.role)}
											</Badge>
										)}
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</ScrollArea.Autosize>
			</Paper>
		</Box>
	);
}

interface ImportModalProps {
	organization: CloudOrganization;
}

function ImportModal({ organization }: ImportModalProps) {
	const inviteMutation = useInvitationMutation(organization.id);
	const rolesQuery = useCloudRolesQuery(organization.id);
	const membersQuery = useCloudMembersQuery(organization.id);
	const invitesQuery = useCloudInvitationsQuery(organization.id);

	const [members, setMembers] = useState<CsvMember[]>();
	const [defaultRole, setDefaultRole] = useState("member");
	const [error, setError] = useState("");
	const [failures, setFailures] = useState<ImportFailure[]>([]);

	// Tracked as a pair, because each accepted invitation invalidates the
	// invitations query and so shrinks the set of rows left to invite
	const [progress, setProgress] = useState<{ sent: number; total: number }>();

	const roles = useMemo(() => {
		return rolesQuery.data?.map((role) => role.name) ?? [];
	}, [rolesQuery.data]);

	const taken = useMemo(() => {
		return [
			// A member's username is the email address they signed up with
			...(membersQuery.data?.map((member) => member.username) ?? []),
			...(invitesQuery.data?.flatMap((invite) =>
				invite.status === "accepted" ? [] : [invite.email],
			) ?? []),
		];
	}, [membersQuery.data, invitesQuery.data]);

	const rows = useMemo(() => {
		return members && resolveMemberImport(members, { roles, defaultRole, taken });
	}, [members, roles, defaultRole, taken]);

	const invitable = useMemo(() => rows?.filter((row) => !row.issue) ?? [], [rows]);
	const isSending = progress !== undefined;

	const handleClose = useStable(() => {
		closeModal(MODAL_ID);
	});

	const handleSelectFile = useStable(async () => {
		try {
			const [file] = await adapter.openFile("Import members", [CSV_FILTER], false);

			if (!file) {
				return;
			}

			setError("");
			setFailures([]);
			setMembers(parseMemberCsv(await file.text()));
		} catch {
			setError("Failed to read the selected CSV file");
		}
	});

	const handleSubmit = useStable(async () => {
		const sending = invitable;
		const failed: ImportFailure[] = [];

		setError("");
		setFailures([]);
		setProgress({ sent: 0, total: sending.length });

		// Invitations are sent one at a time so a single rejected address does
		// not take the rest of the file down with it
		for (const [index, row] of sending.entries()) {
			try {
				await inviteMutation.mutateAsync({
					email: row.email,
					role: row.role,
				});
			} catch (err) {
				failed.push({
					email: row.email,
					message: apiErrorMessage(err, "Failed to send an invitation"),
				});
			}

			setProgress({ sent: index + 1, total: sending.length });
		}

		setProgress(undefined);

		const invited = sending.length - failed.length;

		// Partial failures keep the modal open so each rejected address stays on
		// screen alongside the reason the API gave for turning it down. Retrying
		// skips whoever was invited, since they now count as already invited.
		if (failed.length) {
			setError(`Invited ${invited} of ${sending.length} members.`);
			setFailures(failed);
			return;
		}

		showInfo({
			title: "Import complete",
			subtitle: `Invited ${invited} ${invited === 1 ? "member" : "members"} to the organisation.`,
		});

		handleClose();
	});

	const roleOptions = roles.map((role) => ({
		label: capitalize(normalizeRole(role)),
		value: normalizeRole(role),
	}));

	const inviteLabel = !invitable.length
		? "Invite members"
		: invitable.length === 1
			? "Invite 1 member"
			: `Invite ${invitable.length} members`;

	return (
		<Form onSubmit={handleSubmit}>
			<Stack>
				<Text size="lg">
					Invite multiple members at once from a CSV file listing their email addresses,
					and optionally the role each one should be given.
				</Text>

				{rows === undefined ? (
					<Box mt="md">
						<InputLabel mb="xs">Example CSV</InputLabel>
						<Code
							block
							p="sm"
						>
							{EXAMPLE_CSV}
						</Code>
					</Box>
				) : (
					<MemberImportPreview
						mt="md"
						rows={rows}
					/>
				)}

				<Select
					data={roleOptions}
					label="Default role"
					description="Applied to rows that do not name a role"
					value={defaultRole}
					onChange={setDefaultRole as any}
					disabled={isSending}
				/>

				<Button
					variant="light"
					leftSection={<Icon path={rows === undefined ? iconUpload : iconFile} />}
					onClick={handleSelectFile}
					disabled={isSending}
				>
					{rows === undefined ? "Select CSV file" : "Select another file"}
				</Button>

				{progress && (
					<Box>
						<Text
							fz="sm"
							mb="xs"
						>
							Inviting {progress.sent} of {progress.total} members
						</Text>
						<Progress value={(progress.sent / Math.max(progress.total, 1)) * 100} />
					</Box>
				)}

				{(error || !!failures.length) && (
					<Stack gap={4}>
						{error && (
							<Text
								c="red"
								fz="sm"
							>
								{error}
							</Text>
						)}
						{!!failures.length && (
							<ScrollArea.Autosize mah={140}>
								<Stack gap={4}>
									{failures.map((failure) => (
										<Text
											key={failure.email}
											c="red"
											fz="sm"
											className="selectable"
										>
											<b>{failure.email}</b>: {failure.message}
										</Text>
									))}
								</Stack>
							</ScrollArea.Autosize>
						)}
					</Stack>
				)}

				<Group mt="xl">
					<Button
						onClick={handleClose}
						variant="light"
						flex={1}
						disabled={isSending}
					>
						Close
					</Button>
					<Button
						type="submit"
						variant="gradient"
						flex={1}
						disabled={!isSending && !invitable.length}
						loading={isSending}
					>
						{inviteLabel}
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
