import type { ActionIconProps } from "@mantine/core";

const MAX_PREVIEW_LENGTH = 500;

interface HistoryCodeBlockProps {
	value: string;
	copyCodeProps: ActionIconProps & {
		onClick: () => void;
	};
}

export function getHistoryCodeBlockProps(
	query: string,
	copyText: (text: string) => unknown,
): HistoryCodeBlockProps {
	const value =
		query.length > MAX_PREVIEW_LENGTH ? `${query.slice(0, MAX_PREVIEW_LENGTH)}...` : query;

	return {
		value,
		copyCodeProps: {
			onClick: () => {
				void copyText(query);
			},
		},
	};
}
