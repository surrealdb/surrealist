import { Alert, Button, Group, Loader, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useStable } from "~/hooks/stable";
import { validateOidcIssuerDiscovery, validateOidcJwksUri } from "~/util/oidc-validate";

interface AccessOauthIdpValidationProps {
	issuerUrl: string;
	endpointMode: "discovery" | "explicit";
	readOnly?: boolean;
}

export function AccessOauthIdpValidation({
	issuerUrl,
	endpointMode,
	readOnly,
}: AccessOauthIdpValidationProps) {
	const trimmedIssuer = issuerUrl.trim();
	const [manualCheck, setManualCheck] = useState(false);

	const enabled = endpointMode === "discovery" && trimmedIssuer.length > 0 && !readOnly;

	const { data, isFetching, error, refetch } = useQuery({
		queryKey: ["oidc-discovery-validate", trimmedIssuer],
		enabled: enabled && manualCheck,
		retry: false,
		queryFn: async ({ signal }) => {
			const discovery = await validateOidcIssuerDiscovery(trimmedIssuer, signal);

			if (!discovery.ok) {
				return discovery;
			}

			const jwks = await validateOidcJwksUri(discovery.jwksUri, signal);

			return { discovery, jwks };
		},
	});

	const runCheck = useStable(() => {
		setManualCheck(true);
		refetch();
	});

	const result = useMemo(() => {
		if (!manualCheck || isFetching) {
			return null;
		}

		if (error) {
			return {
				color: "red" as const,
				title: "OIDC validation failed",
				message: error instanceof Error ? error.message : "Validation failed",
			};
		}

		if (!data) {
			return null;
		}

		if ("ok" in data && data.ok === false) {
			return {
				color: "red" as const,
				title: "OIDC discovery failed",
				message: data.error,
			};
		}

		const { discovery, jwks } = data as {
			discovery: Extract<
				Awaited<ReturnType<typeof validateOidcIssuerDiscovery>>,
				{ ok: true }
			>;
			jwks: Awaited<ReturnType<typeof validateOidcJwksUri>>;
		};

		if (jwks && !jwks.ok) {
			return {
				color: "orange" as const,
				title: "OIDC discovery succeeded, JWKS check failed",
				message: `${discovery.issuer} — ${jwks.error}`,
			};
		}

		const jwksLine =
			jwks?.ok === true
				? `JWKS reachable (${jwks.keyCount} key${jwks.keyCount === 1 ? "" : "s"}).`
				: "No jwks_uri in discovery document.";

		return {
			color: "green" as const,
			title: "OIDC issuer validated",
			message: [
				`Issuer: ${discovery.issuer}`,
				discovery.authorizationEndpoint && `Authorize: ${discovery.authorizationEndpoint}`,
				discovery.tokenEndpoint && `Token: ${discovery.tokenEndpoint}`,
				jwksLine,
			]
				.filter(Boolean)
				.join(" "),
		};
	}, [data, error, isFetching, manualCheck]);

	if (!enabled) {
		return null;
	}

	return (
		<Stack gap="xs">
			<Group>
				<Button
					size="xs"
					variant="light"
					disabled={isFetching}
					onClick={runCheck}
				>
					Validate OIDC issuer
				</Button>
				{isFetching && <Loader size="xs" />}
			</Group>

			{result && (
				<Alert
					color={result.color}
					title={result.title}
				>
					<Text
						size="sm"
						className="selectable"
					>
						{result.message}
					</Text>
				</Alert>
			)}
		</Stack>
	);
}
