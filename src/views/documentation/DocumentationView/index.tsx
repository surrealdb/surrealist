import { Group } from "@mantine/core";
import { TocPane } from "../TopicsPane";
import { ArticlePane } from "../ArticlePane";
import { useMemo, useRef, useState } from "react";
import { useSchema } from "~/hooks/schema";
import { buildDocumentation } from "~/docs";
import { useSetting } from "~/hooks/config";

export function DocumentationView() {
	const [language, setLanguage] = useSetting("behavior", "docsLanguage");

	const schema = useSchema();
	const scrollRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState("");

	const docs = useMemo(() => schema ? buildDocumentation(schema) : [], [schema]);

	return (
		<>
			<Group
				h="100%"
				wrap="nowrap"
				gap="var(--surrealist-divider-size)"
			>
				<TocPane
					active={active}
					docs={docs}
					language={language}
					scrollRef={scrollRef}
				/>
				<ArticlePane
					docs={docs}
					language={language}
					scrollRef={scrollRef}
					onLanguageChange={setLanguage}
					onChangeActiveTopic={setActive}
				/>
			</Group>
		</>
	);
}
