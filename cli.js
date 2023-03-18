#!/usr/bin/env node
import process from "node:process";
import meow from "meow";
import {Listr} from "listr2";
import {$} from "execa";

const cli = meow(`
    Usage
      $ listr <command> [...]

      Commands should be space-separated. Commands with spaces in them must be surrounded by quotes.

	  Equivalent to 'command1 && command2 && ...'.

	Options
	  --all-optional  Continue executing tasks if one fails.      [default: exit]
	  --hide-timer    Disable showing successful task durations.  [default: show]

	Examples
	  Run test commands in order
	  $ listr xo 'c8 ava'

	  Run commands that can fail
	  $ listr xo ava tsd --all-optional
`, {
	importMeta: import.meta,
	description: false,
	flags: {
		help: {
			type: "boolean",
			alias: "h",
		},
		allOptional: {
			type: "boolean",
			default: false,
		},
		hideTimer: {
			type: "boolean",
			default: false,
		},
	},
});

const {input: commands} = cli;
const {help: helpShortFlag, allOptional, hideTimer} = cli.flags;

if(commands.length === 0 || helpShortFlag) {
	cli.showHelp(0);
}

/**
 * Returns the name of a given command and optionally any of its arguments.
 *
 * @param {string} command The given command to parse.
 * @param {object} options Whether or not to return the command's arguments.
 * @param {boolean} options.getArgs Whether or not to return the command's arguments.
 * @returns {string | [commandName: string, args: string[]]}
 */
const parseCommand = (command, {getArgs = false} = {}) => {
	const [commandName, ...args] = command.split(" ");

	return getArgs ? [commandName, args] : commandName;
};

// Stops task list if `cli.flags.allOptional` is true (default behavior)

/**
 * Fails a task. Stops the task list if `cli.flags.allOptional`
 * is true (default behavior).
 *
 * @param {string} [output] Command output to display, if any.
 */
const endTask = (output) => {
	throw new Error(output);
};

/**
 * Trims command output if it only contains one non-empty line.
 *
 * @param {string} output Command output.
 * @returns {string} The trimmed output, if needed, or the original output.
 */
const trimIfNeeded = (output) => {
	const trimmed = output.trim();

	return trimmed.includes("\n") ? output : trimmed;
};

const tasks = new Listr(commands.map(command => /** @type {import('listr2').ListrTask} */({
	title: parseCommand(command),
	task: async ({$$}, task) => {
		const [commandName, args] = parseCommand(command, {getArgs: true});

		task.title = `Running "${command}"...`;

		const {exitCode, all, message} = await $$`${commandName} ${args}`;

		if(exitCode === 127 || message?.includes("ENOENT")) {
			task.title = commandName === command
				? `${commandName}: command not found.`
				: `${commandName}: command "${command}" not found.`;

			endTask();
		}

		task.title = commandName;

		if(exitCode !== 0) {
			endTask(trimIfNeeded(all));
		}

		task.output = trimIfNeeded(all);
	},
	options: {
		persistentOutput: true,
	},
})), {
	exitOnError: !allOptional,
	collectErrors: false,
	rendererOptions: {
		showTimer: !hideTimer,
		collapseErrors: false,
		formatOutput: "wrap",
		removeEmptyLines: false,
	},
});

await tasks.run({
	$$: $({
		shell: true,
		reject: false,
		all: true,
		// Keep command output formatting
		stripFinalNewline: false,
		env: {
			// https://github.com/sindresorhus/execa/issues/69#issuecomment-278693026
			FORCE_COLOR: true,
		},
	}),
}).catch(() => process.exit(1));
