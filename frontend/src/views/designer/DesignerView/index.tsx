import { Splitter } from "~/components/Splitter";

export function DesignerView() {
	return (
		<Splitter
			minSize={[undefined, 325]}
			bufferSize={500}
			direction="horizontal"
			endPane={
				<div />
			}
		>
			<div />
		</Splitter>
	);
}