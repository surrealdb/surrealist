export interface SignInOptions {
	screen?: "signin" | "signup";
	redirect?: boolean;
}

export interface SignOutOptions {
	localOnly?: boolean;
}
