import { Alert, Button, Group, Loader, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useStable } from "~/hooks/stable";
import { validateJwksUrl } from "~/util/oidc-validate";

interface AccessJwksValidationProps {
	jwksUrl: string;
	readOnly?: boolean;
}

export function AccessJwksValidation({ jwksUrl, readOnly }: AccessJwksValidationProps) {
	const trimmed = jwksUrl.trim();
	const [manualCheck, setManualCheck] = useState(false);

	const enabled = trimmed.length > 0 && !readOnly;

	const { data, isFetching, error, refetch } = useQuery({
		queryKey: ["jwks-validate", trimmed],
		enabled: enabled && manualCheck,
		retry: false,
		queryFn: ({ signal }) => validateJwksUrl(trimmed, signal),
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
				title: "JWKS validation failed",
				message: error instanceof Error ? error.message : "Validation failed",
			};
		}

		if (!data) {
			return null;
		}

		if (!data.ok) {
			return {
				color: "red" as const,
				title: "JWKS validation failed",
				message: data.error,
			};
		}

		return {
			color: "green" as const,
			title: "JWKS endpoint validated",
			message: `Found ${data.keyCount} usable key${data.keyCount === 1 ? "" : "s"}.`,
		};
	}, [data, error, isFetching, manualCheck]);

	if (!enabled) {
		return null;
	}

	return (
		<>
			<Group>
				<Button
					size="xs"
					variant="light"
					disabled={isFetching}
					onClick={runCheck}
				>
					Validate JWKS URL
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
		</>
	);
}
