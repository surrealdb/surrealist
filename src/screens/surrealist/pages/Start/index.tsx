import { AuthGuard } from "~/components/AuthGuard";

export function StartPage() {
	return <AuthGuard>Hello!</AuthGuard>;
}
