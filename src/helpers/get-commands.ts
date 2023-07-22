import type { Match } from "./types.js";

export type Command = {
	taskTitle: string;
	command: string;
};

/**
 * Matches named tasks. Ignores quoted tasks.
 *
 * @see https://regex101.com/r/zhFo8i/3
 *
 * @example
 * 1. /(?!["'])/       // Ignore quoted tasks
 * 2. /(?<title>[^:]*)/ // Capture task title (anything before :)
 * 3. /:/               // Skip separator (:)
 * 4. /(?<command>.*)/  // Capture task command (anything after :)
 */
const commandRegex = /(?!["'])^(?<title>[^:"']*):(?<command>.*)/m;

/**
 * Parses CLI input into tasks. Searches for custom names for the task title,
 * defaulting to the first word of a command. If a task is surrounded by
 * quotes (single or double), it's treated as an unnamed task.
 *
 * @example
 * // listr lint:xo tsd 'coverage and tests:c8 ava' '"yarn run:tests"'
 * getCommands(["lint:xo", "tsd", "coverage and tests:c8 ava", "\"yarn run:tests\""]);
 *
 * [
 * 	{ taskTitle: "lint",               command: "xo"             },
 * 	{ taskTitle: "tsd",                command: "tsd"            },
 * 	{ taskTitle: "coverage and tests", command: "c8 ava"         },
 * 	{ taskTitle: "yarn",               command: "yarn run:tests" },
 * ]
 */
export const getCommands = (input: string[]) => input.map(task => {
	const command = task.match(commandRegex) as Match<"title" | "command">;
	const isNamedTask = command !== null;

	if (isNamedTask) {
		return { taskTitle: command.groups.title, command: command.groups.command };
	}

	// Ignore any quotes surrounding task: https://regex101.com/r/OokNZu/2
	task = task.replace(/^"(.*)"$|^'(.*)'$/m, "$1$2");

	const [commandName] = task.split(" ", 1);
	return { taskTitle: commandName, command: task };
});
