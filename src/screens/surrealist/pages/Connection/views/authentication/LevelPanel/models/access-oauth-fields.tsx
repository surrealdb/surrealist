import {
	Button,
	Checkbox,
	Group,
	PasswordInput,
	Radio,
	Stack,
	TagsInput,
	Text,
	TextInput,
} from "@mantine/core";
import { Icon, iconClose, iconPlus } from "@surrealdb/ui";
import { LearnMore } from "~/components/LearnMore";
import type { AccessJwtOAuthForm, OAuthEndpointMode } from "~/util/access-define";
import { AccessOauthIdpValidation } from "./access-oauth-idp-validation";
import { OAuthRedirectUriHints } from "./oauth-redirect-uri-hints";

interface AccessOAuthFieldsProps {
	value: AccessJwtOAuthForm;
	oidcIssuer: string;
	readOnly?: boolean;
	onChange: (value: AccessJwtOAuthForm) => void;
}

export function AccessOAuthFields({
	value,
	oidcIssuer,
	readOnly,
	onChange,
}: AccessOAuthFieldsProps) {
	const patch = (partial: Partial<AccessJwtOAuthForm>) => {
		onChange({ ...value, ...partial });
	};

	const addRedirectUri = () => {
		patch({ redirectUris: [...value.redirectUris, ""] });
	};

	const updateRedirectUri = (index: number, uri: string) => {
		const next = [...value.redirectUris];
		next[index] = uri;
		patch({ redirectUris: next });
	};

	const removeRedirectUri = (index: number) => {
		patch({ redirectUris: value.redirectUris.filter((_, i) => i !== index) });
	};

	if (!value.enabled) {
		return (
			<Checkbox
				label="Enable OAuth thin broker"
				description="Proxy authorization-code and refresh-token flows to an external IdP"
				checked={false}
				disabled={readOnly}
				onChange={(e) => {
					if (e.currentTarget.checked) {
						onChange({ ...value, enabled: true });
					}
				}}
			/>
		);
	}

	return (
		<Stack gap="lg">
			<Checkbox
				label="Enable OAuth thin broker"
				checked
				disabled={readOnly}
				onChange={(e) => {
					if (!e.currentTarget.checked) {
						onChange({ ...value, enabled: false });
					}
				}}
			/>

			<Radio.Group
				label="IdP endpoints"
				value={value.endpointMode}
				onChange={(mode) => patch({ endpointMode: mode as OAuthEndpointMode })}
			>
				<Stack
					gap="xs"
					mt="xs"
				>
					<Radio
						value="discovery"
						label="OIDC discovery (use JWT issuer URL)"
						disabled={readOnly}
						variant="gradient"
					/>
					<Radio
						value="explicit"
						label="Explicit authorize and token URLs"
						disabled={readOnly}
						variant="gradient"
					/>
				</Stack>
			</Radio.Group>

			{value.endpointMode === "discovery" && !oidcIssuer.trim() && (
				<Text size="sm">Set the OIDC issuer URL above.</Text>
			)}

			<AccessOauthIdpValidation
				issuerUrl={oidcIssuer}
				endpointMode={value.endpointMode}
				readOnly={readOnly}
			/>

			{value.endpointMode === "explicit" && (
				<>
					<TextInput
						label="Authorize URL"
						placeholder="https://idp.example.com/oauth2/v1/authorize"
						value={value.authorizeUrl}
						spellCheck={false}
						readOnly={readOnly}
						required
						onChange={(e) => patch({ authorizeUrl: e.target.value })}
					/>
					<TextInput
						label="Token URL"
						placeholder="https://idp.example.com/oauth2/v1/token"
						value={value.tokenUrl}
						spellCheck={false}
						readOnly={readOnly}
						required
						onChange={(e) => patch({ tokenUrl: e.target.value })}
					/>
				</>
			)}

			<TextInput
				label="Client ID"
				placeholder="application client id"
				value={value.clientId}
				spellCheck={false}
				readOnly={readOnly}
				required
				onChange={(e) => patch({ clientId: e.target.value })}
			/>

			<PasswordInput
				label="Client secret"
				description="Leave unchanged when shown as [REDACTED]"
				placeholder="optional"
				value={value.clientSecret === "[REDACTED]" ? "" : value.clientSecret}
				readOnly={readOnly}
				onChange={(e) => patch({ clientSecret: e.target.value })}
			/>

			<TagsInput
				label="Scopes"
				placeholder="openid"
				value={value.scopes}
				readOnly={readOnly}
				onChange={(scopes) => patch({ scopes })}
			/>

			<TextInput
				label="Audience (optional)"
				placeholder="api://default"
				value={value.audience}
				spellCheck={false}
				readOnly={readOnly}
				onChange={(e) => patch({ audience: e.target.value })}
			/>

			<Stack gap="xs">
				<Text
					size="sm"
					fw={500}
				>
					Redirect URIs
				</Text>
				{value.redirectUris.map((uri, index) => (
					<Group
						key={index}
						wrap="nowrap"
					>
						<TextInput
							flex={1}
							placeholder="https://app.example.com/callback"
							value={uri}
							spellCheck={false}
							readOnly={readOnly}
							onChange={(e) => updateRedirectUri(index, e.target.value)}
						/>
						<Button
							variant="light"
							color="pink"
							disabled={readOnly}
							onClick={() => removeRedirectUri(index)}
						>
							<Icon path={iconClose} />
						</Button>
					</Group>
				))}
				<Button
					variant="light"
					size="xs"
					w="fit-content"
					disabled={readOnly}
					leftSection={<Icon path={iconPlus} />}
					onClick={addRedirectUri}
				>
					Add redirect URI
				</Button>

				<OAuthRedirectUriHints
					redirectUris={value.redirectUris}
					readOnly={readOnly}
					onAddUris={(uris) => {
						const existing = new Set(value.redirectUris);
						const merged = [...value.redirectUris];

						for (const uri of uris) {
							if (!existing.has(uri)) {
								merged.push(uri);
								existing.add(uri);
							}
						}

						patch({ redirectUris: merged });
					}}
				/>
			</Stack>

			<LearnMore href="https://surrealdb.com/docs/surrealdb/security/authentication">
				Learn more about access methods and OAuth
			</LearnMore>
		</Stack>
	);
}
