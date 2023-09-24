import { useState } from "react";
import { Splitter, SplitValues } from "~/components/Splitter";
import { SessionsPane } from "../SessionsPane";
import { LiveQueryPane } from "../LiveQueryPane";
import { InboxPane } from "../InboxPane";

export interface QueryViewProps {
}

export function LiveView() {
	const [splitValues, setSplitValues] = useState<SplitValues>([450, undefined]);
	const [innerSplitValues, setInnerSplitValues] = useState<SplitValues>([undefined, undefined]);

	return (
		<Splitter
			minSize={300}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			bufferSize={520}
			startPane={
				<Splitter
					minSize={120}
					values={innerSplitValues}
					onChange={setInnerSplitValues}
					bufferSize={0}
					direction="vertical"
					endPane={
						<SessionsPane />
					}
				>
					<LiveQueryPane />
				</Splitter>
			}
		>
			<InboxPane />
		</Splitter>
	);
}
