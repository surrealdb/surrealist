import {
	ActionIcon,
	Alert,
	Button,
	Collapse,
	CopyButton,
	Group,
	Stack,
	Text,
	Title,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { Icon, iconCheck, iconChevronDown, iconChevronUp, iconCopy, iconPlus } from "@surrealdb/ui";
import { useEffect, useState } from "react";
import { useIsLight } from "~/hooks/theme";
import {
	redirectUriListIncludes,
	type SurrealOAuthRedirectUriHint,
	surrealOAuthRedirectUriHints,
} from "~/util/surreal-oauth";

interface OAuthRedirectUriHintsProps {
	redirectUris: string[];
	readOnly?: boolean;
	onAddUris: (uris: string[]) => void;
}

export function OAuthRedirectUriHints({
	redirectUris,
	readOnly,
	onAddUris,
}: OAuthRedirectUriHintsProps) {
	const hints = surrealOAuthRedirectUriHints();
	const missing = hints.filter((hint) => !redirectUriListIncludes(redirectUris, hint.uri));
	const allAdded = missing.length === 0;
	const [expanded, setExpanded] = useState(!allAdded);
	const isLight = useIsLight();
	const completeColor = isLight ? "obsidian.1" : "obsidian.7";

	useEffect(() => {
		if (allAdded) {
			setExpanded(false);
		}
	}, [allAdded]);

	const addMissing = () => {
		if (missing.length === 0) {
			return;
		}

		onAddUris(missing.map((hint) => hint.uri));
	};

	return (
		<Alert
			mt="md"
			px="sm"
			py={expanded ? "sm" : 6}
			variant="light"
			color={allAdded ? completeColor : "blue"}
		>
			<Group
				justify="space-between"
				gap="xs"
				wrap="nowrap"
			>
				<UnstyledButton
					flex={1}
					mih={28}
					onClick={() => setExpanded((open) => !open)}
					aria-expanded={expanded}
				>
					<Group
						gap="xs"
						wrap="nowrap"
					>
						<Title
							fz={13}
							fw={500}
						>
							Surrealist support
						</Title>
					</Group>
				</UnstyledButton>

				<Group
					gap={4}
					wrap="nowrap"
				>
					{!readOnly && missing.length > 0 && (
						<Button
							variant="subtle"
							size="compact-xs"
							leftSection={<Icon path={iconPlus} />}
							onClick={(event) => {
								event.stopPropagation();
								addMissing();
							}}
						>
							Add {missing.length} suggested
						</Button>
					)}
					{allAdded && (
						<Group
							gap={4}
							wrap="nowrap"
							mr="sm"
						>
							<Icon
								path={iconCheck}
								size={14}
								c="var(--surreal-energy)"
							/>
							<Text size="xs">Configured</Text>
						</Group>
					)}
					<UnstyledButton
						onClick={() => setExpanded((open) => !open)}
						aria-label={expanded ? "Collapse Surrealist redirect URIs" : "Expand"}
					>
						<Icon path={expanded ? iconChevronUp : iconChevronDown} />
					</UnstyledButton>
				</Group>
			</Group>

			<Collapse expanded={expanded}>
				<Text
					size="xs"
					mb="sm"
					c="slate"
				>
					Register on your IdP and in{" "}
					<Text
						span
						fw={500}
					>
						REDIRECT_URIS
					</Text>{" "}
					above.
				</Text>

				<Stack
					gap="xs"
					ml="sm"
				>
					{hints.map((hint) => (
						<HintRow
							key={hint.id}
							hint={hint}
							added={redirectUris.includes(hint.uri)}
						/>
					))}
				</Stack>
			</Collapse>
		</Alert>
	);
}

function HintRow({ hint, added }: { hint: SurrealOAuthRedirectUriHint; added: boolean }) {
	return (
		<Group
			gap={6}
			wrap="nowrap"
		>
			<Tooltip
				label={hint.description}
				withArrow
				multiline
				w={220}
			>
				<Text
					size="xs"
					fw={500}
					w={64}
					style={{ flexShrink: 0 }}
				>
					<b>{hint.label}</b>
				</Text>
			</Tooltip>

			<Text
				size="xs"
				flex={1}
				truncate
				className="selectable"
				title={hint.uri}
			>
				<pre style={{ margin: 0 }}>{hint.uri.trim()}</pre>
			</Text>

			{added && (
				<Icon
					path={iconCheck}
					size={14}
					c="var(--surreal-energy)"
					aria-label="Already added"
				/>
			)}

			<CopyButton value={hint.uri}>
				{({ copied, copy }) => (
					<ActionIcon
						size="sm"
						variant={copied ? "gradient" : "subtle"}
						aria-label={`Copy ${hint.label} redirect URI`}
						onClick={copy}
					>
						<Icon path={copied ? iconCheck : iconCopy} />
					</ActionIcon>
				)}
			</CopyButton>
		</Group>
	);
}
