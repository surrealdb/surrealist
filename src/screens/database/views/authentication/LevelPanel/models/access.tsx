import classes from "../style.module.scss";

import {
	Accordion,
	Button,
	Checkbox,
	Group,
	Modal,
	PasswordInput,
	ScrollArea,
	Select,
	SimpleGrid,
	Stack,
	Tabs,
	Text,
	Textarea,
	TextInput,
	Title,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { CodeInput } from "~/components/Inputs";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { ACCESS_TYPES } from "~/constants";
import { useStable } from "~/hooks/stable";
import { SectionTitle } from "~/providers/Designer/helpers";
import { executeQuery } from "~/screens/database/connection/connection";
import type { AccessType, Base, SchemaAccess } from "~/types";
import { showError } from "~/util/helpers";
import { iconAccount, iconChat, iconCheck, iconClock, iconJSON, iconKey, iconPlus, iconQuery } from "~/util/icons";
import { readBlock, syncConnectionSchema, writeBlock } from "~/util/schema";

type VerifyMode = "url" | "keyalg";

export interface AccessEditorModalProps {
	level: Base;
	existing: SchemaAccess | null;
	opened: boolean;
	onClose: () => void;
}

export function AccessEditorModal({ level, existing, opened, onClose }: AccessEditorModalProps) {
	const [target, setTarget] = useState<SchemaAccess | null>(null);
	const [name, setName] = useInputState("");
	const [type, setType] = useState<AccessType>("RECORD");
	const [authClause, setAuthClause] = useState("");
	const [signinClause, setSigninClause] = useState("");
	const [signupClause, setSignupClause] = useState("");
	const [sessionDuration, setSessionDuration] = useInputState("");
	const [tokenDuration, setTokenDuration] = useInputState("");
	const [jwtIssuerKey, setJwtIssuerKey] = useInputState("");
	const [jwtVerifyAlg, setJwtVerifyAlg] = useInputState("");
	const [jwtVerifyKey, setJwtVerifyKey] = useInputState("");
	const [jwtVerifyUrl, setJwtVerifyUrl] = useInputState("");
	const [jwtVerifyMode, setJwtVerifyMode] = useState<VerifyMode>("keyalg");
	const [comment, setComment] = useInputState("");

	useLayoutEffect(() => {
		if (opened) {
			setTarget(existing);
			setName(existing?.name ?? "");
			setType(existing?.kind?.kind ?? "RECORD");
			setAuthClause(readBlock(existing?.authenticate ?? ""));
			setComment(existing?.comment ?? "");
			setSessionDuration(existing?.duration?.session?.toString() ?? "");
			setTokenDuration(existing?.duration?.token?.toString() ?? "1h");
			setJwtIssuerKey(existing?.kind?.jwt?.issuer?.key ?? "");
			setJwtVerifyMode("keyalg");
			setSigninClause("");
			setSignupClause("");
			setJwtVerifyAlg("");
			setJwtVerifyKey("");
			setJwtVerifyUrl("");

			if (existing?.kind?.kind === "RECORD") {
				setSigninClause(readBlock(existing.kind.signin));
				setSignupClause(readBlock(existing.kind.signup));
			}

			const verify = existing?.kind?.jwt?.verify;

			if (verify) {
				if ("url" in verify) {
					setJwtVerifyMode("url");
					setJwtVerifyUrl(verify.url);
				} else {
					setJwtVerifyMode("keyalg");
					setJwtVerifyAlg(verify.alg);
					setJwtVerifyKey(verify.key);
				}
			}
		}
	}, [opened, existing]);

	const saveUser = useStable(async () => {
		try {
			let query = `DEFINE ACCESS OVERWRITE ${name} ON ${level} TYPE`;

			if (type === "RECORD") {
				query += ` RECORD`;

				if (signinClause) {
					query += ` SIGNIN ${writeBlock(signinClause)}`;
				}

				if (signupClause) {
					query += ` SIGNUP ${writeBlock(signupClause)}`;
				}

				if (jwtIssuerKey || jwtVerifyAlg || jwtVerifyKey || jwtVerifyUrl) {
					query += ` WITH JWT`;

					if (jwtVerifyMode === "url") {
						query += ` URL "${jwtVerifyUrl}"`;
					} else {
						query += ` ALGORITHM ${jwtVerifyAlg} KEY "${jwtVerifyKey}"`;
					}

					if (jwtIssuerKey) {
						query += ` WITH ISSUER KEY "${jwtIssuerKey}"`;
					}
				}
			} else if (type === "JWT") {
				query += ` JWT`;

				if (jwtVerifyMode === "url") {
					query += ` URL "${jwtVerifyUrl}"`;
				} else {
					query += ` ALGORITHM ${jwtVerifyAlg} KEY "${jwtVerifyKey}"`;
				}
			}

			if (authClause) {
				query += ` AUTHENTICATE ${writeBlock(authClause)}`;
			}

			const durations: string[] = [];

			if (tokenDuration) {
				durations.push(`FOR TOKEN ${tokenDuration}`);
			}

			if (sessionDuration) {
				durations.push(`FOR SESSION ${sessionDuration}`);
			}

			if (durations.length > 0) {
				query += ` DURATION ${durations.join(", ")}`;
			}

			if (comment) {
				query += ` COMMENT "${comment}"`;
			}

			console.log(query);

			await executeQuery(query);
			await syncConnectionSchema();
		} catch (err: any) {
			showError({
				title: "Failed to save user",
				subtitle: err.message,
			});
		} finally {
			onClose();
		}
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			scrollAreaComponent={ScrollArea.Autosize}
			size={500}
			title={
				<PrimaryTitle>
					{existing
						? `Editing access method ${existing.name}`
						: `Create ${level.toLowerCase()} access method`}
				</PrimaryTitle>
			}
		>
			<Form onSubmit={saveUser}>
				<Tabs defaultValue="general">
					<Tabs.List grow mb="xl">
						<Tabs.Tab value="general">General</Tabs.Tab>
						<Tabs.Tab value="session">Session</Tabs.Tab>
						<Tabs.Tab value="durations">Durations</Tabs.Tab>
						<Tabs.Tab value="jwt">JWT</Tabs.Tab>
						<Tabs.Tab value="comment">Comment</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value="general">
						<Stack gap="lg">
							{!target && (
								<TextInput
									label="Access method name"
									placeholder="admin"
									value={name}
									spellCheck={false}
									onChange={setName}
									required
								/>
							)}

							<Select
								data={ACCESS_TYPES}
								label="Access type"
								value={type}
								onChange={setType as any}
								withAsterisk
							/>

							<CodeInput
								label="Authentication query"
								placeholder="Enter authentication clause"
								value={authClause}
								onChange={setAuthClause}
								multiline
								height={96}
							/>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="session">
						<Stack gap="lg">
							<CodeInput
								label="Sign in query"
								placeholder="SELECT * FROM ..."
								value={signinClause}
								onChange={setSigninClause}
								multiline
								height={96}
							/>

							<CodeInput
								label="Sign up query"
								placeholder="CREATE ..."
								value={signupClause}
								onChange={setSignupClause}
								multiline
								height={96}
							/>

							<LearnMore href="https://surrealdb.com/docs/surrealdb/security/authentication#record-users">
								Learn more about sign in and sign up queries
							</LearnMore>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="durations">
						<Stack gap="lg">
							<CodeInput
								label="Token duration"
								description="The duration of the token used to establish an authenticated session"
								placeholder="Enter duration"
								value={tokenDuration}
								onChange={setTokenDuration}
							/>

							<CodeInput
								label="Session duration"
								description="The duration of the authenticated session established with the token"
								placeholder="Enter duration"
								value={sessionDuration}
								onChange={setSessionDuration}
							/>

							<LearnMore href="https://surrealdb.com/docs/surrealdb/security/authentication#expiration">
								Learn more about session and token durations
							</LearnMore>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="jwt">
						<Stack gap="lg">
							{type === "RECORD" && (
								<TextInput
									label="Issuer key"
									placeholder="secret key"
									value={jwtIssuerKey}
									onChange={setJwtIssuerKey}
								/>
							)}

							<Checkbox
								label="Use JWKS verification"
								checked={jwtVerifyMode === "url"}
								onChange={(e) => {
									setJwtVerifyMode(e.target.checked ? "url" : "keyalg");
								}}
							/>

							{jwtVerifyMode === "url" ? (
								<TextInput
									label="JWKS Endpoint"
									placeholder="https://example.com/.well-known/jwks.json"
									value={jwtVerifyUrl}
									onChange={setJwtVerifyUrl}
								/>
							) : (
								<>
									<TextInput
										label="Verify algorithm"
										placeholder="HS256"
										value={jwtVerifyAlg}
										onChange={setJwtVerifyAlg}
									/>

									<TextInput
										label="Verify key"
										placeholder="secret key"
										value={jwtVerifyKey}
										onChange={setJwtVerifyKey}
									/>
								</>
							)}
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="comment">
						<Textarea
							placeholder="Enter optional description for this access method"
							value={comment}
							onChange={setComment}
							rows={5}
						/>
					</Tabs.Panel>
				</Tabs>

				{/* 
						<Text
							fz="xl"
							fw={600}
							c="bright"
							mt="lg"
							mb={-10}
						>
							Comment
						</Text>

						<Textarea
							placeholder="Enter optional description for this access method"
							value={comment}
							onChange={setComment}
							rows={5}
						/>
					</Stack>
					<Stack>
						<Text
							fz="xl"
							fw={600}
							c="bright"
							mt="lg"
							mb={-10}
						>
							Queries
						</Text>

						<CodeInput
							label="Authentication query"
							placeholder="Enter authentication clause"
							value={authClause}
							onChange={setAuthClause}
							multiline
							height={96}
						/>
						{type === "RECORD" && (
							<>
								<CodeInput
									label="Sign in query"
									placeholder="SELECT * FROM ..."
									value={signinClause}
									onChange={setSigninClause}
									multiline
									height={96}
								/>
								<CodeInput
									label="Sign up query"
									placeholder="CREATE ..."
									value={signupClause}
									onChange={setSignupClause}
									multiline
									height={96}
								/>
							</>
						)}
					</Stack>
				</SimpleGrid> */}
				<Group mt="lg">
					<Button
						onClick={onClose}
						color="slate"
						variant="light"
					>
						Close
					</Button>
					<Spacer />
					<Button
						type="submit"
						variant="gradient"
						rightSection={<Icon path={target ? iconCheck : iconPlus} />}
					>
						{target ? "Save access method" : "Create access method"}
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
