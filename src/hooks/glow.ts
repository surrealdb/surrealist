import { matchRoute, useRouter } from "wouter";
import { useAbsoluteLocation } from "./routing";

export function useGlowOffset() {
	const parser = useRouter().parser;
	const [location] = useAbsoluteLocation();

	switch (true) {
		case matchRoute(parser, "/c/:connection/dashboard", location)[0]:
		case matchRoute(parser, "/c/:connection/sidekick", location)[0]:
			return 300;
		case matchRoute(parser, "/c/:connection/:view", location)[0]:
			return 600;
		case matchRoute(parser, "/overview", location)[0]:
			return 150;
		default:
			return 300;
	}
}
