import { expect, mock, test } from "bun:test";
import { getHistoryCodeBlockProps } from "../src/screens/surrealist/pages/Connection/views/query/HistoryDrawer/helpers";

test("history code block copies the full query while previewing a truncated query", () => {
	const query = "SELECT * FROM person WHERE active = true;\n".repeat(20);
	const copyText = mock((_text: string) => {});
	const props = getHistoryCodeBlockProps(query, copyText);

	expect(props.value).toBe(`${query.slice(0, 500)}...`);

	props.copyCodeProps.onClick();

	expect(copyText).toHaveBeenCalledTimes(1);
	expect(copyText).toHaveBeenCalledWith(query);
});
