#!/usr/bin/env tsx
import process from "node:process";
import meow from "meow";
import { $ } from "execa";
import { getTasks } from "./tasks.js";

const cli = meow(`
	Usage
	  $ listr <command> […]

	  Commands should be space-separated. Commands with spaces in them must be surrounded by quotes.

	  Equivalent to 'command1 && command2 && …'.

	Options
	  --all-optional            Continue executing tasks if one fails.      [default: exit]
	  --hide-timer              Disable showing successful task durations.  [default: show]
	  --environment, --env, -e  Set environment variables via process.env.

	Examples
	  Run test commands in order
	  $ listr xo 'c8 ava'

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
			// TODO: Disabled due to sindresorhus/meow#164
			// isMultiple: true,
		},
	},
});

const { input: commands, flags: { help: helpShortFlag } } = cli;

if (commands.length === 0 || helpShortFlag) {
	cli.showHelp(0);
}

const { allOptional, hideTimer, environment } = cli.flags;

if (environment) {
	// Parse environment variables, based on https://github.com/rollup/rollup/blob/master/cli/run/index.ts#L42-L53
	for (const pair of environment.split(",")) {
		const [key, ...value] = pair.split(":") as [string, ...string[]];

		process.env[key] = value.length === 0 ? String(true) : value.join(":");
	}
}

const tasks = getTasks({
	commands,
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
