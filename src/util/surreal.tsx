
/**
 * Returns whether the result is a permission error
 * 
 * @param result The result to check
 * @returns True if the result is a permission error
 */
export function isPermissionError(result: any) {
	return typeof result === 'string' && result.includes('Not enough permissions to perform this action');
}