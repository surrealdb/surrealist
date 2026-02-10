import {
	ActionIcon,
	Box,
	CopyButton,
	MantineSize,
	type MantineSpacing,
	Paper,
	type PaperProps,
	ScrollArea,
	Text,
} from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import clsx from "clsx";
import { type ReactNode, useMemo } from "react";
import { useIsLight, useTheme } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { dedent } from "~/util/dedent";
import { attr } from "~/util/helpers";
import { renderHighlighting } from "~/util/highlighting";
import { iconCheck, iconCopy } from "~/util/icons";
import classes from "./style.module.scss";

export interface CodeProps extends CodePreviewOptions {
	value: string;
}

export interface CodePreviewOptions extends PaperProps {
	label?: string;
	language?: string;
	bg?: string;
	leftSection?: ReactNode;
	rightSection?: ReactNode;
	withCopy?: boolean;
	copyOffset?: number;
	copySize?: MantineSize;
	withDedent?: boolean;
	withWrapping?: boolean;
	padding?: MantineSpacing;
}

export function CodePreview({
	value,
	label,
	language,
	bg,
	withCopy,
	copyOffset,
	copySize,
	rightSection,
	withDedent,
	padding,
	className,
	withWrapping,
	...rest
}: CodeProps) {
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
				data-wrapping={attr(withWrapping)}
				shadow="none"
				bg={bg ?? (isLight ? "slate.0" : "slate.9")}
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

				{!rightSection && withCopy && value ? (
					<CopyButton value={value}>
						{({ copied, copy }) => (
							<ActionIcon
								variant="gradient"
								pos="absolute"
								size={copySize ?? "lg"}
								top={copyOffset ?? 9}
								right={copyOffset ?? 9}
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
						>
							{rightSection}
						</Box>
					)
				)}
			</Paper>
		</>
	);
}
