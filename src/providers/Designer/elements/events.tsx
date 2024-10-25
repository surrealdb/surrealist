import { Accordion, TextInput } from "@mantine/core";
import { CodeInput } from "~/components/Inputs";
import { useStable } from "~/hooks/stable";
import type { SchemaEvent } from "~/types";
import { iconBullhorn } from "~/util/icons";
import { type ElementProps, SectionTitle } from "../helpers";
import { Lister } from "../lister";

export function EventsElement({ data, setData }: ElementProps) {
	const initEvent = useStable(() => ({
		name: "",
		when: "",
		then: [""],
	}));

	const handleChange = useStable((events: SchemaEvent[]) => {
		setData((draft) => {
			draft.events = events;
		});
	});

	return (
		<Accordion.Item value="events">
			<SectionTitle icon={iconBullhorn}>Events</SectionTitle>
			<Accordion.Panel>
				<Lister
					value={data.events}
					missing="No schema events defined yet"
					name="event"
					factory={initEvent}
					onChange={handleChange}
				>
					{(event, setEvent, isCreating) => (
						<>
							<TextInput
								autoFocus
								required
								label="Event name"
								placeholder="event_name"
								disabled={!isCreating}
								value={event.name}
								spellCheck={false}
								onChange={(e) =>
									setEvent((draft) => {
										draft.name = e.target.value;
									})
								}
							/>
							<CodeInput
								required
								label="Event condition"
								value={event.when}
								onChange={(value) =>
									setEvent((draft) => {
										draft.when = value;
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
									setEvent((draft) => {
										draft.then[0] = value;
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
