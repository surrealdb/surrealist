import {
	Alert,
	Button,
	Checkbox,
	Group,
	Modal,
	ScrollArea,
	Select,
	Stack,
	Tabs,
	TextInput,
	Textarea,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useMemo, useState } from "react";
import { escapeIdent } from "surrealdb";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { CodeInput } from "~/components/Inputs";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import type { AccessType, Base, SchemaAccess } from "~/types";
import { showError } from "~/util/helpers";
import { iconPlus } from "~/util/icons";
import { readBlock, syncConnectionSchema, writeBlock } from "~/util/schema";

type VerifyMode = "url" | "keyalg";

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
	onClose: () => void;
}

export function AccessEditorModal({ level, existing, opened, onClose }: AccessEditorModalProps) {
	const [target, setTarget] = useState<SchemaAccess | null>(null);
	const [name, setName] = useInputState("");
	const [type, setType] = useState<AccessType>("RECORD");
	const [authClause, setAuthClause] = useState("");
	const [signupClause, setSignupClause] = useState("");
	const [signinClause, setSigninClause] = useState("");
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
			const defaultType = level === "DATABASE" ? "RECORD" : "JWT";

			setTarget(existing);
			setName(existing?.name ?? "");
			setType(existing?.kind?.kind ?? defaultType);
			setAuthClause(readBlock(existing?.authenticate ?? ""));
			setComment(existing?.comment ?? "");
			setSessionDuration(existing?.duration?.session?.toString() ?? "");
			setTokenDuration(existing?.duration?.token?.toString() ?? "1h");
			setJwtIssuerKey(existing?.kind?.jwt?.issuer?.key ?? "");
			setJwtVerifyMode("keyalg");
			setSigninClause("");
			setSignupClause("");
			setJwtVerifyAlg("HS256");
			setJwtVerifyKey("");
			setJwtVerifyUrl("");

			if (existing?.kind?.kind === "RECORD") {
				setSignupClause(readBlock(existing.kind.signup));
				setSigninClause(readBlock(existing.kind.signin));
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
	}, [level, opened, existing]);

	const accessTypes = useMemo(() => {
		const record =
			level === "DATABASE"
				? { label: "Record", value: "RECORD" }
				: { label: "Record (database only)", value: "RECORD", disabled: true };

		return [{ label: "JWT", value: "JWT" }, record];
	}, [level]);

	const saveUser = useStable(async () => {
		try {
			let query = `DEFINE ACCESS OVERWRITE ${escapeIdent(name)} ON ${level} TYPE`;

			if (type === "RECORD") {
				query += ` RECORD`;

				if (signupClause) {
					query += ` SIGNUP ${writeBlock(signupClause)}`;
				}

				if (signinClause) {
					query += ` SIGNIN ${writeBlock(signinClause)}`;
				}

				if (jwtIssuerKey || jwtVerifyKey || jwtVerifyUrl) {
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
						? `Viewing access method ${existing.name}`
						: `Create ${level.toLowerCase()} access method`}
				</PrimaryTitle>
			}
		>
			<Form onSubmit={saveUser}>
				<Tabs defaultValue="general">
					<Tabs.List
						grow
						mb="xl"
					>
						<Tabs.Tab value="general">General</Tabs.Tab>

						{type === "RECORD" && <Tabs.Tab value="session">Session</Tabs.Tab>}

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
								withAsterisk
								readOnly={!!existing} // NOTE temp
								label="Access type"
								value={type}
								onChange={setType as any}
								data={accessTypes}
							/>

							<CodeInput
								label="Authentication query"
								placeholder="Enter authentication clause"
								readOnly={!!existing} // NOTE temp
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
								label="Sign up query"
								placeholder="CREATE ..."
								value={signupClause}
								onChange={setSignupClause}
								readOnly={!!existing} // NOTE temp
								multiline
								height={96}
							/>

							<CodeInput
								label="Sign in query"
								placeholder="SELECT * FROM ..."
								value={signinClause}
								onChange={setSigninClause}
								readOnly={!!existing} // NOTE temp
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
								description="The duration of the token used to establish an authenticated session"
								placeholder="Enter duration"
								value={tokenDuration}
								onChange={setTokenDuration}
								readOnly={!!existing} // NOTE temp
							/>

							<CodeInput
								label="Session duration"
								description="The duration of the authenticated session established with the token"
								placeholder="Enter duration"
								value={sessionDuration}
								onChange={setSessionDuration}
								readOnly={!!existing} // NOTE temp
							/>

							<LearnMore href="https://surrealdb.com/docs/surrealdb/security/authentication#expiration">
								Learn more about session and token durations
							</LearnMore>
						</Stack>
					</Tabs.Panel>

					<Tabs.Panel value="jwt">
						<Stack gap="lg">
							{type === "JWT" && (
								<TextInput
									label="Issuer key"
									placeholder="secret key"
									value={jwtIssuerKey}
									onChange={setJwtIssuerKey}
									readOnly={!!existing} // NOTE temp
								/>
							)}

							<Checkbox
								label="Use JWKS verification"
								checked={jwtVerifyMode === "url"}
								disabled={!!existing} // NOTE temp
								onChange={(e) => {
									setJwtVerifyMode(e.target.checked ? "url" : "keyalg");
								}}
							/>

							{jwtVerifyMode === "url" ? (
								<TextInput
									label="JWKS Endpoint"
									placeholder="https://example.com/.well-known/jwks.json"
									readOnly={!!existing} // NOTE temp
									value={jwtVerifyUrl}
									onChange={setJwtVerifyUrl}
								/>
							) : (
								<>
									<Select
										data={ALGORITHMS}
										label="Verify algorithm"
										value={jwtVerifyAlg}
										onChange={setJwtVerifyAlg}
										readOnly={!!existing} // NOTE temp
									/>

									<TextInput
										label="Verify key"
										placeholder="secret key"
										value={jwtVerifyKey}
										onChange={setJwtVerifyKey}
										readOnly={!!existing} // NOTE temp
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
							readOnly={!!existing} // NOTE temp
							rows={5}
						/>
					</Tabs.Panel>
				</Tabs>

				<Group mt="xl">
					<Button
						onClick={onClose}
						color="slate"
						variant="light"
						flex={1}
					>
						Close
					</Button>
					{/* <Button
						type="submit"
						variant="gradient"
						flex={1}
						disabled
						rightSection={<Icon path={target ? iconCheck : iconPlus} />}
					>
						{target ? "Save access method" : "Create access method"}
					</Button> */}
					{target ? (
						<Spacer />
					) : (
						<Button
							type="submit"
							variant="gradient"
							flex={1}
							rightSection={<Icon path={iconPlus} />}
						>
							Create access method
						</Button>
					)}
				</Group>
			</Form>
		</Modal>
	);
}
