import { Button, type ButtonProps, Tooltip } from "@mantine/core";
import type { PropsWithChildren } from "react";
import { Link } from "wouter";

/** Explains to a member why they cannot deploy an instance. */
export const DEPLOY_INSTANCE_DENIED =
	"You do not have permission to deploy an instance. Please contact your organisation administrator to continue.";

/** Explains to a member why they cannot create a context. */
export const DEPLOY_CONTEXT_DENIED =
	"You do not have permission to create a context. Please contact your organisation administrator to continue.";

/** Explains why deploying is unavailable while the organisation is restricted. */
export const DEPLOY_RESTRICTED =
	"This organisation has been restricted due to failed payments. Please update your billing and payment information to continue.";

export interface DeployBlockOptions {
	/** The resource the user is trying to create. */
	resource: "instance" | "context";
	/** Whether the user holds an admin role or higher in the organisation. */
	isAdmin: boolean;
	/** Whether the organisation is restricted, normally over failed payments. */
	isRestricted?: boolean;
}

/**
 * Returns the reason deployment is unavailable, or `undefined` when it is
 * available.
 *
 * The role is reported ahead of billing so a member is told the one thing they
 * can act on, rather than a payment problem they have no way to resolve.
 */
export function resolveDeployBlock({
	resource,
	isAdmin,
	isRestricted,
}: DeployBlockOptions): string | undefined {
	if (!isAdmin) {
		return resource === "instance" ? DEPLOY_INSTANCE_DENIED : DEPLOY_CONTEXT_DENIED;
	}

	if (isRestricted) {
		return DEPLOY_RESTRICTED;
	}

	return undefined;
}

export interface DeployButtonProps extends ButtonProps {
	/** The deployment flow this button opens. */
	href: string;
	/**
	 * Why deployment is unavailable. When set the button is rendered inert and a
	 * tooltip carries the reason, otherwise it behaves as a normal button.
	 */
	blockedReason?: string;
}

/**
 * The call to action opening a deployment flow, shared by the instance and
 * context listings so both explain themselves the same way.
 *
 * A blocked button stays visible rather than disappearing, so a member who
 * cannot deploy still learns the capability exists and who to ask for it.
 */
export function DeployButton({
	href,
	blockedReason,
	children,
	...other
}: PropsWithChildren<DeployButtonProps>) {
	if (blockedReason) {
		return (
			<Tooltip
				label={blockedReason}
				position="bottom-end"
				maw={280}
				multiline
				withArrow
			>
				{/* `data-disabled` stands in for the native `disabled` attribute, since a
				    truly disabled button dispatches no pointer events and would swallow
				    the tooltip explaining itself. */}
				<Button
					variant="gradient"
					data-disabled
					aria-disabled
					onClick={(event) => event.preventDefault()}
					{...other}
				>
					{children}
				</Button>
			</Tooltip>
		);
	}

	return (
		<Link href={href}>
			<Button
				variant="gradient"
				{...other}
			>
				{children}
			</Button>
		</Link>
	);
}
