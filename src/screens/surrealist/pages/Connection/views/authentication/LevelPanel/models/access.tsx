import {
	Alert,
	Button,
	Checkbox,
	Divider,
	Group,
	Modal,
	ScrollArea,
	Select,
	Stack,
	Tabs,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";

import { Icon, iconCheck, iconPlus } from "@surrealdb/ui";
import { useLayoutEffect, useMemo, useState } from "react";
import { Form } from "~/components/Form";
import { CodeInput } from "~/components/Inputs";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { executeQuery } from "~/screens/surrealist/pages/Connection/connection/connection";
import type { AccessType, Base, SchemaAccess } from "~/types";
import {
	type AccessDefineForm,
	accessDefineFormFromSchema,
	accessHasOAuth,
	buildDefineAccessQuery,
	defaultAccessDefineForm,
	validateAccessDefineForm,
} from "~/util/access-define";
import { useOAuthFeatureEnabled } from "~/util/feature-flags";
import { showErrorNotification } from "~/util/helpers";
import { syncConnectionSchema } from "~/util/schema";
import { AccessJwksValidation } from "./access-jwks-validation";
import { AccessOAuthFields } from "./access-oauth-fields";

const ALGORITHMS = [
	"EDDSA",
	"ES256",
	"ES384",
	"ES512",
	"HS256",
	"HS384",
	"HS512",
	"PS256",
	"PS384",
	"PS512",
	"RS256",
	"RS384",
	"RS512",
];

export interface AccessEditorModalProps {
	level: Base;
	existing: SchemaAccess | null;
	opened: boolean;
	list: SchemaAccess[];
	onClose: () => void;
}

export function AccessEditorModal({
	level,
	existing,
	opened,
	list,
	onClose,
}: AccessEditorModalProps) {
	const oauthEnabled = useOAuthFeatureEnabled();
	const [form, setForm] = useState<AccessDefineForm>(() => defaultAccessDefineForm(level));
	const [activeTab, setActiveTab] = useState("general");
	const [validationError, setValidationError] = useState<string | null>(null);

	useLayoutEffect(() => {
		if (opened) {
			setForm(accessDefineFormFromSchema(existing, level));
			setActiveTab("general");
			setValidationError(null);
		}
	}, [level, opened, existing]);

	const accessTypes = useMemo(() => {
		const record =
			level === "DATABASE"
				? { label: "Record", value: "RECORD" }
				: { label: "Record (database only)", value: "RECORD", disabled: true };

		return [{ label: "JWT", value: "JWT" }, record];
	}, [level]);

	const patchForm = (partial: Partial<AccessDefineForm>) => {
		setForm((current) => ({ ...current, ...partial }));
		setValidationError(null);
	};

	const saveAccess = useStable(async () => {
		const error = validateAccessDefineForm(form);

		if (error) {
			setValidationError(error);
			return;
		}

		try {
			await executeQuery(buildDefineAccessQuery(form));
			await syncConnectionSchema();
			onClose();
		} catch (err: unknown) {
			showErrorNotification({
				title: "Failed to save access method",
				content: err instanceof Error ? err.message : String(err),
			});
		}
	});

	const isConflicting = !existing && list.some((access) => access.name === form.name);
	const formValidation = validateAccessDefineForm(form);
	const isValid =
		!isConflicting && form.name.length > 0 && formValidation === null && !validationError;

	const showJwtBlock = form.type === "JWT" || (form.type === "RECORD" && form.recordJwtEnabled);
	const showOAuthFields = oauthEnabled || (!!existing && accessHasOAuth(existing));
	const oauthFieldsReadOnly = !oauthEnabled && form.oauth.enabled;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			scrollAreaComponent={ScrollArea.Autosize}
			size={560}
			title={
				<PrimaryTitle>
					{existing
						? `Edit access method ${existing.name}`
						: `Create ${level.toLowerCase()} access method`}
				</PrimaryTitle>
			}
		>
			<Form onSubmit={saveAccess}>
				<Tabs
					value={activeTab}
					onChange={(value) => value && setActiveTab(value)}
					variant="surreal"
				>
					<Tabs.List>
						<Tabs.Tab value="general">General</Tabs.Tab>
						<Tabs.Tab value="durations">Durations</Tabs.Tab>
						<Tabs.Tab value="jwt">JWT</Tabs.Tab>
						{form.type === "RECORD" && <Tabs.Tab value="session">Session</Tabs.Tab>}
						<Tabs.Tab value="comment">Comment</Tabs.Tab>
					</Tabs.List>

					<Divider mb="xl" />

					<Tabs.Panel value="general">
						<Stack gap="lg">
							{!existing && (
								<TextInput
									label="Access method name"
									placeholder="okta"
									value={form.name}
									spellCheck={false}
									onChange={(e) => patchForm({ name: e.target.value })}
									error={isConflicting && "This name is already in use"}
									data-autofocus
									required
								/>
							)}

							<Select
								withAsterisk
								disabled={!!existing}
								label="Access type"
								value={form.type}
								onChange={(value) => patchForm({ type: value as AccessType })}
								data={accessTypes}
							/>

							<CodeInput
								label="Authentication query"
								placeholder="RETURN …"
								value={form.authenticate}
								onChange={(value) => patchForm({ authenticate: value })}
								multiline
								height={96}
							/>

							{(validationError ?? formValidation) && (
								<Text
									size="sm"
									c="red"
								>
									{validationError ?? formValidation}
								</Text>
							)}
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="session">
						<Stack gap="lg">
							<CodeInput
								label="Sign up query"
								placeholder="CREATE …"
								value={form.signup}
								onChange={(value) => patchForm({ signup: value })}
								multiline
								height={96}
							/>

							<CodeInput
								label="Sign in query"
								placeholder="SELECT …"
								value={form.signin}
								onChange={(value) => patchForm({ signin: value })}
								multiline
								height={96}
							/>

							<LearnMore href="https://surrealdb.com/docs/surrealdb/security/authentication#record-users">
								Learn more about sign up and sign in queries
							</LearnMore>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="durations">
						<Stack gap="lg">
							<CodeInput
								label="Token duration"
								description="Duration of the token used to establish an authenticated session"
								placeholder="1h"
								value={form.tokenDuration}
								onChange={(value) => patchForm({ tokenDuration: value })}
							/>

							<CodeInput
								label="Session duration"
								description="Duration of the authenticated session"
								placeholder="8h"
								value={form.sessionDuration}
								onChange={(value) => patchForm({ sessionDuration: value })}
							/>

							<LearnMore href="https://surrealdb.com/docs/surrealdb/security/authentication#expiration">
								Learn more about session and token durations
							</LearnMore>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="jwt">
						<Stack gap="lg">
							{form.type === "RECORD" && (
								<Checkbox
									label="Use JWT verification"
									checked={form.recordJwtEnabled}
									onChange={(e) =>
										patchForm({ recordJwtEnabled: e.currentTarget.checked })
									}
								/>
							)}

							{showJwtBlock && (
								<>
									<TextInput
										label="OIDC issuer URL"
										description="Used for OIDC discovery and OAuth broker (TYPE JWT ISSUER)"
										placeholder="https://your-org.okta.com"
										value={form.oidcIssuer}
										spellCheck={false}
										onChange={(e) => patchForm({ oidcIssuer: e.target.value })}
									/>

									{!form.oidcIssuer.trim() && (
										<>
											<Checkbox
												label="Use JWKS URL for verification"
												checked={form.jwtVerifyMode === "url"}
												onChange={(e) =>
													patchForm({
														jwtVerifyMode: e.currentTarget.checked
															? "url"
															: "keyalg",
													})
												}
											/>

											{form.jwtVerifyMode === "url" ? (
												<>
													<TextInput
														label="JWKS endpoint"
														placeholder="https://example.com/.well-known/jwks.json"
														value={form.jwtVerifyUrl}
														spellCheck={false}
														onChange={(e) =>
															patchForm({
																jwtVerifyUrl: e.target.value,
															})
														}
													/>
													<AccessJwksValidation
														jwksUrl={form.jwtVerifyUrl}
													/>
												</>
											) : (
												<>
													<Select
														data={ALGORITHMS}
														label="Verify algorithm"
														value={form.jwtVerifyAlg}
														onChange={(value) =>
															patchForm({
																jwtVerifyAlg: value ?? "HS256",
															})
														}
													/>

													<TextInput
														label="Verify key"
														placeholder="shared secret"
														value={form.jwtVerifyKey}
														spellCheck={false}
														onChange={(e) =>
															patchForm({
																jwtVerifyKey: e.target.value,
															})
														}
													/>
												</>
											)}
										</>
									)}

									{form.type === "RECORD" && (
										<TextInput
											label="Issuer signing key (optional)"
											description="WITH ISSUER KEY for record access JWT"
											placeholder="secret key"
											value={form.issueKey}
											spellCheck={false}
											onChange={(e) =>
												patchForm({ issueKey: e.target.value })
											}
										/>
									)}

									{showOAuthFields && (
										<>
											<Divider
												label="OAuth"
												labelPosition="left"
											/>

											{oauthFieldsReadOnly && (
												<Alert color="orange">
													Instance OAuth editing is not enabled in this
													environment. Configuration is shown read-only.
												</Alert>
											)}

											<AccessOAuthFields
												value={form.oauth}
												oidcIssuer={form.oidcIssuer}
												readOnly={oauthFieldsReadOnly}
												onChange={(oauth) => patchForm({ oauth })}
											/>
										</>
									)}
								</>
							)}
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="comment">
						<Textarea
							placeholder="Optional description"
							value={form.comment}
							onChange={(e) => patchForm({ comment: e.target.value })}
							rows={5}
						/>
					</Tabs.Panel>
				</Tabs>

				<Group mt="xl">
					<Button
						onClick={onClose}
						color="obsidian"
						variant="light"
						flex={1}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="gradient"
						flex={1}
						disabled={!isValid}
						rightSection={<Icon path={existing ? iconCheck : iconPlus} />}
					>
						{existing ? "Save access method" : "Create access method"}
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
