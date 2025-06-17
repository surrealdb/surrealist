import { draw } from "radash";

export const ADJECTIVE_LIST = [
	"brave",
	"silent",
	"ancient",
	"bright",
	"clever",
	"crimson",
	"daring",
	"elegant",
	"fuzzy",
	"gentle",
	"hidden",
	"icy",
	"jolly",
	"lucky",
	"mighty",
	"nimble",
	"proud",
	"quick",
	"rustic",
	"shiny",
	"tiny",
	"vivid",
	"wild",
	"zealous",
	"surreal",
	"ethereal",
	"mystic",
];

export const NOUN_LIST = [
	"falcon",
	"river",
	"forest",
	"mountain",
	"ocean",
	"panther",
	"phoenix",
	"castle",
	"meadow",
	"comet",
	"dragon",
	"ember",
	"galaxy",
	"harbor",
	"island",
	"jungle",
	"lotus",
	"nebula",
	"orchid",
	"pearl",
	"quartz",
	"reef",
	"shadow",
	"valley",
];

/**
 * Generate a random name by combining a random adjective and a random noun.
 */
export function generateRandomName() {
	return `${draw(ADJECTIVE_LIST)}-${draw(NOUN_LIST)}`;
}

/**
 * Generate a unique name that does not exist in the provided set of existing names.
 */
export function generateUniqueName(existing: Set<string>) {
	const name = generateRandomName();

	if (existing.has(name)) {
		return generateUniqueName(existing);
	}

	return name;
}
