/**
 * Trims command output if it only contains one non-empty line.
 *
 * @param output Command output.
 * @returns The trimmed output, if needed, or the original output.
 */
export const trimIfNeeded = (output: string) => {
	const trimmed = output.trim();

	return trimmed.includes("\n") ? output : trimmed;
};
