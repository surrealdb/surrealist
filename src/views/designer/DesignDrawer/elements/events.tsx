import { Accordion, TextInput } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";
import { Lister } from "../lister";
import { useStable } from "~/hooks/stable";
import { CodeInput } from "~/components/Inputs";
import { iconBullhorn } from "~/util/icons";

export function EventsElement({ data, setData }: ElementProps) {

	const addEvent = useStable(() => {
		setData((d) => {
			d.events.push({
				name: "",
				when: "",
				then: [""],
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
			<SectionTitle icon={iconBullhorn}>
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
								autoFocus
								required
								label="Event name"
								placeholder="event_name"
								value={event.name}
								onChange={(e) =>
									setData((draft) => {
										draft.events[i].name = e.target.value;
									})
								}
							/>
							<CodeInput
								required
								label="Event condition"
								value={event.when}
								onChange={(value) =>
									setData((draft) => {
										draft.events[i].when = value;
									})
								}
							/>
							<CodeInput
								mt="sm"
								required
								label="Event handler"
								multiline
								value={event.then[0]}
								onChange={(value) =>
									setData((draft) => {
										draft.events[i].then[0] = value;
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