type ParsedCommand<GetArgs extends boolean> = (
	GetArgs extends true
		? [commandName: string, args: string[]]
		: string
);

/**
 * Returns the name of a given command and optionally any of its arguments.
 *
 * @param command The given command to parse.
 * @param getArgs Whether or not to return the command's arguments.
 */
export const parseCommand = <const GetArgs extends boolean = false>(
	command: string,
	{ getArgs }: { getArgs?: GetArgs } = {},
): ParsedCommand<GetArgs> => {
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split#using_split
	// Since the separator is " ", `command.split` will always have a string at index 0
	const [commandName, ...args] = command.split(" ");
	const parsedCommand = (getArgs ? [commandName, args] : commandName) as ParsedCommand<GetArgs>;

	return parsedCommand;
};

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
