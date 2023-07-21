export type Command = {
	taskTitle: string;
	command: string;
};

type RegExpGroups<T extends string> = (
	| (RegExpMatchArray & {
		groups: { [name in T]: string } | Record<string, string>;
	})
	| null // eslint-disable-line @typescript-eslint/ban-types
);

/** @see https://regex101.com/r/zhFo8i/1 */
const commandRegex = /(?<title>[^:]*):(?<command>.*)/;

/**
 * Parses CLI input into tasks. Searches for custom names for the task title,
 * defaulting to the first word of a command.
 *
 * @example
 * getCommands(["lint:xo", "tsd", "coverage and tests:c8 ava"]);
 *
 * [
 * 	{ taskTitle: "lint",               command: "xo"     },
 * 	{ taskTitle: "tsd",                command: "tsd"    },
 * 	{ taskTitle: "coverage and tests", command: "c8 ava" },
 * ]
 */
export const getCommands = (input: string[]) => input.map(task => {
	const command = task.match(commandRegex) as RegExpGroups<"title" | "command">;
	const isNamedTask = command !== null;

	if (isNamedTask) {
		return { taskTitle: command.groups.title, command: command.groups.command };
	}

	const [commandName] = task.split(" ", 1);
	return { taskTitle: commandName, command: task };
});
