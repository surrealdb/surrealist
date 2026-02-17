import { matchRoute, useRouter } from "wouter";
import { useAbsoluteLocation } from "./routing";

export function useGlowOffset() {
	const parser = useRouter().parser;
	const [location] = useAbsoluteLocation();

	switch (true) {
		case matchRoute(parser, "/overview", location)[0]:
			return 50;
		case matchRoute(parser, "/c/:connection/dashboard", location)[0]:
			return 125;
		case matchRoute(parser, "/c/:connection/:view", location)[0]:
			return 500;
		default:
			return 125;
	}
}
