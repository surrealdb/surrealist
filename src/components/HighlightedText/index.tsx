import { useColorScheme } from "@mantine/hooks";
import { useMemo } from "react";
import { useConfigStore } from "~/stores/config";
import { CodeLang } from "~/types";
import { renderHighlighting } from "~/util/highlighting";
import classes from "./style.module.scss";

export interface HighlightedTextProps {
	children: string;
	language?: CodeLang | "surrealql";
}

export function HighlightedText({ children, language = "surrealql" }: HighlightedTextProps) {
	const colorScheme = useColorScheme();
	const syntaxTheme = useConfigStore((state) => state.settings.appearance.syntaxTheme);

	const highlightedText = useMemo(() => {
		return renderHighlighting(children, language, colorScheme, syntaxTheme);
	}, [children, language, colorScheme, syntaxTheme]);

	return (
		<span
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Safe to use
			dangerouslySetInnerHTML={{ __html: highlightedText }}
			className={classes.textRoot}
		/>
	);
}
