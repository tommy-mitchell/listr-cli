import type { Command } from "./types.js";

// Ignore any quotes surrounding task: https://regex101.com/r/OokNZu/2
const surroundingQuotesRegex = /^"(.*)"$|^'(.*)'$/m;

const removeSurroundingQuotes = (command: string) => command.replace(surroundingQuotesRegex, "$1$2");

export const parseUnnamedCommand = (command: string): Command => {
	command = removeSurroundingQuotes(command);

	const [commandName] = command.split(" ", 1);
	return { taskTitle: commandName, command };
};
