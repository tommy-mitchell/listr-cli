import type { Command } from "./types.js";
import { parseNamedCommand } from "./parse-named-commands.js";
import { parseUnnamedCommand } from "./parse-unnamed-command.js";

/**
 * Parses CLI input into tasks. Searches for custom names for the task title,
 * defaulting to the first word of a command. If a task is surrounded by
 * quotes (single or double), it's treated as an unnamed task.
 *
 * @example
 * // listr lint::xo tsd 'coverage and tests::c8 ava' '"yarn run:tests"'
 * getCommands(["lint::xo", "tsd", "coverage and tests::c8 ava", "\"yarn run:tests\""]);
 *
 * [
 * 	{ taskTitle: "lint",               command: "xo"             },
 * 	{ taskTitle: "tsd",                command: "tsd"            },
 * 	{ taskTitle: "coverage and tests", command: "c8 ava"         },
 * 	{ taskTitle: "yarn",               command: "yarn run:tests" },
 * ]
 */
export const getCommands = (input: string[]): Command[] => input.map(rawCommand => {
	const { isNamedCommand, command: namedCommand } = parseNamedCommand(rawCommand);

	if (isNamedCommand) {
		return namedCommand;
	}

	return parseUnnamedCommand(rawCommand);
});
