import { Textarea } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/tab";
import { actions, store } from "~/store";

export function QueryPane() {
	const activeTab = useActiveTab();

	if (!activeTab) {
		throw new Error('This should not happen');
	}

	const setQuery = useStable((event: React.ChangeEvent<HTMLTextAreaElement>) => {
		store.dispatch(actions.updateTab({
			id: activeTab.id,
			query: event.target.value
		}));
	});

	return (
		<Textarea
			value={activeTab?.query}
			onChange={setQuery}
			styles={{
				root: {
					height: 'calc(100% - 15px)'
				},
				wrapper: {
					height: '100%'
				},
				input: {
					height: '100%'
				}
			}}
		/>
	)
}