import { User } from "@auth0/auth0-react";

/**
 * @param user 
 * @returns Retrieves auth provider from user id
 */
export function getAuthProvider(user?: User): string {
	return user?.sub?.split("|")[0] ?? "unknown";
}