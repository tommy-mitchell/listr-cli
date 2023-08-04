#!/usr/bin/env tsx
import process from "node:process";
import meow from "meow";
import { $ } from "execa";
import { applyEnvironmentVariables, getCommands } from "./helpers/index.js";
import { getTasks } from "./tasks.js";

// TODO: add option to collapse output from finished tasks while running
const cli = meow(`
	Usage
	  $ listr [title::]<command> […]

	  Commands should be space-separated. Commands with spaces in them must be surrounded by quotes.

	  Equivalent to 'command1 && command2 && …'.

	Options
	  --all-optional, --opt     Continue executing tasks if one fails      [default: exit]
	  --hide-timer              Disable showing successful task durations  [default: show]
	  --environment, --env, -e  Set environment variables via process.env

	Examples
	  Run named test commands in order
	  $ listr lint::xo 'tests and coverage::c8 ava'

	  Run commands that can fail
	  $ listr xo ava tsd --all-optional

	  Set environment variables
	  $ listr ava --env CI,NODE_OPTIONS:'--loader=tsx'
	  #=> process.env.CI = "true"
	  #=> process.env.NODE_OPTIONS = "--loader=tsx"
`, {
	importMeta: import.meta,
	description: false,
	flags: {
		help: {
			type: "boolean",
			shortFlag: "h",
		},
		allOptional: {
			type: "boolean",
			aliases: ["opt"],
			default: false,
		},
		hideTimer: {
			type: "boolean",
			default: false,
		},
		environment: {
			type: "string",
			aliases: ["env"],
			shortFlag: "e",
			isMultiple: true,
			default: [],
		},
	},
});

const { input, flags: { help: helpShortFlag } } = cli;

if (input.length === 0 || helpShortFlag) {
	cli.showHelp(0);
}

const { allOptional, hideTimer, environment } = cli.flags;

applyEnvironmentVariables(environment);

const tasks = getTasks({
	commands: getCommands(input),
	exitOnError: !allOptional,
	showTimer: !hideTimer,
});

const $$ = $({
	shell: true,
	reject: false,
	all: true,
	stripFinalNewline: false, // Keep command output formatting
});

await tasks.run({ $$ }).catch(() => process.exit(1));
