export type Command = {
	taskTitle: string;
	command: string;
};

/** Parses CLI input into tasks. Searches for custom names for the task title, defaulting to the first word of a command. */
export const parseInput = (input: string[]) => input.map(task => {
	// TODO: use regex?
	const [taskTitle, ...command] = task.split(":");
	const isNamedTask = command.length > 0;

	if (isNamedTask) {
		return { taskTitle, command: command.join(":") };
	}

	const [commandName] = task.split(" ", 1);
	return { taskTitle: commandName, command: task };
});

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
