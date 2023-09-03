import { Accordion, TextInput } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";
import { QueryInput } from "../inputs";
import { Lister } from "../lister";
import { useStable } from "~/hooks/stable";

export function EventsElement({ data, setData }: ElementProps) {

	const addEvent = useStable(() => {
		setData((d) => {
			d.events.push({
				name: "",
				cond: "",
				then: "",
			});
		});
	});

	const removeEvent = useStable((index: number) => {
		setData((d) => {
			d.events.splice(index, 1);
		});
	});

	return (
		<Accordion.Item value="events">
			<SectionTitle>
				Events
			</SectionTitle>
			<Accordion.Panel>
				<Lister
					value={data.events}
					missing="No schema events defined yet"
					name="event"
					onCreate={addEvent}
					onRemove={removeEvent}
				>
					{(event, i) => (
						<>
							<TextInput
								required
								autoFocus
								label="Event name"
								placeholder="event_name"
								value={event.name}
								onChange={(e) =>
									setData((draft) => {
										draft.events[i].name = e.target.value;
									})
								}
							/>
							<QueryInput
								required
								label="Event condition"
								value={event.cond}
								onChangeText={(value) =>
									setData((draft) => {
										draft.events[i].cond = value;
									})
								}
							/>
							<QueryInput
								required
								label="Event result"
								value={event.then}
								onChangeText={(value) =>
									setData((draft) => {
										draft.events[i].then = value;
									})
								}
							/>
						</>
					)}
				</Lister>
			</Accordion.Panel>
		</Accordion.Item>
	);
}