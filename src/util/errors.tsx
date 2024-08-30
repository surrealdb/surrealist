/**
 * Thrown during a failure in a cloud operation.
 */
export class CloudError extends Error {
	public constructor(message: string) {
		super(message);
	}
}