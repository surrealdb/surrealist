import classes from "./style.module.scss";

import {
	ActionIcon,
	Box,
	CopyButton,
	type MantineSpacing,
	Paper,
	type PaperProps,
	ScrollArea,
	Text,
} from "@mantine/core";

import clsx from "clsx";
import { type ReactNode, useMemo } from "react";
import { useIsLight, useTheme } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { dedent } from "~/util/dedent";
import { renderHighlighting } from "~/util/highlighting";
import { iconCheck, iconCopy } from "~/util/icons";
import { Icon } from "../Icon";

export interface CodePreviewProps extends PaperProps {
	value: string;
	label?: string;
	language?: string;
	leftSection?: ReactNode;
	rightSection?: ReactNode;
	withCopy?: boolean;
	withDedent?: boolean;
	padding?: MantineSpacing;
}

export function CodePreview({
	value,
	label,
	language,
	withCopy,
	rightSection,
	withDedent,
	padding,
	className,
	...rest
}: CodePreviewProps) {
	const isLight = useIsLight();

	const colorScheme = useTheme();
	const syntaxTheme = useConfigStore((s) => s.settings.appearance.syntaxTheme);

	const sippet = useMemo(() => {
		return renderHighlighting(
			withDedent ? dedent(value) : value,
			language,
			colorScheme,
			syntaxTheme,
		);
	}, [value, withDedent, language, colorScheme, syntaxTheme]);

	const rightPadding = withCopy && !rightSection;

	return (
		<>
			{label && (
				<Text
					ff="mono"
					tt="uppercase"
					fw={600}
					mb="sm"
					c="bright"
				>
					{label}
				</Text>
			)}
			<Paper
				pos="relative"
				className={clsx(classes.root, className)}
				shadow="none"
				bg={isLight ? "slate.0" : "slate.9"}
				fz="lg"
				{...rest}
			>
				<ScrollArea.Autosize>
					<Box
						p={padding ?? "lg"}
						pr={rightPadding ? 64 : 0}
						// biome-ignore lint/security/noDangerouslySetInnerHtml: Highlighting
						dangerouslySetInnerHTML={{ __html: sippet }}
					/>
				</ScrollArea.Autosize>

				{withCopy && value ? (
					<CopyButton value={value}>
						{({ copied, copy }) => (
							<ActionIcon
								variant="gradient"
								pos="absolute"
								size="lg"
								top={9}
								right={9}
								onClick={copy}
								className={classes.copy}
								aria-label="Copy code to clipboard"
							>
								<Icon path={copied ? iconCheck : iconCopy} />
							</ActionIcon>
						)}
					</CopyButton>
				) : (
					rightSection && (
						<Box
							pos="absolute"
							top={6}
							right={6}
							style={{ zIndex: 1 }}
						>
							{rightSection}
						</Box>
					)
				)}
			</Paper>
		</>
	);
}
