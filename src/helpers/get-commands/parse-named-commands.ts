import type { Match } from "../types.js";
import type { Command } from "./types.js";

type NamedCommand = {
	isNamedCommand: true;
	command: Command;
};

type UnnamedCommand = {
	isNamedCommand: false;
	command: Record<string, never>;
};

type MaybeNamedCommand = NamedCommand | UnnamedCommand;

/**
 * Matches named tasks separated with a `::`. Ignores quoted tasks.
 *
 * @see https://regex101.com/r/zhFo8i/4
 *
 * @example
* 1. /(?!["'])/        // Ignore quoted tasks
* 2. /(?<title>[^:]*)/ // Capture task title (anything before :)
* 3. /::/              // Skip separator (::)
* 4. /(?<command>.*)/  // Capture task command (anything after ::)
*/
const commandRegex = /(?!["'])^(?<title>[^:"']*)::(?<command>.*)/m;

export const parseNamedCommand = (command: string): MaybeNamedCommand => {
	const namedCommand = command.match(commandRegex) as Match<"title" | "command">;
	const isNamedCommand = namedCommand !== null;

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		isNamedCommand,
		command: isNamedCommand ? {
			taskTitle: namedCommand.groups.title,
			command: namedCommand.groups.command,
			commandName: namedCommand.groups.command.split(" ")[0],
		} : {},
	} as MaybeNamedCommand;
};
