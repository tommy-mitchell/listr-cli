import process from "node:process";
import { Listr, PRESET_TIMER, type ListrTask } from "listr2";
import { $, type ExecaReturnValue } from "execa";
import { isCI } from "ci-info";
import { parseCommand, trimIfNeeded } from "./helpers.js";

/**
 * Fails a task. Stops the task list if `cli.flags.allOptional`
 * is true (default behavior).
 *
 * @param output Command output to display, if any.
 */
export const endTask = (output = "") => {
	throw new Error(output);
};

type ListrContext = {
	$$: typeof $;
};

type TaskContext = {
	commands: string[];
	exitOnError: boolean;
	showTimer: boolean;
};

export const getTasks = ({ commands, exitOnError, showTimer }: TaskContext) => {
	const tasks = commands.map(command => ({
		title: parseCommand(command),
		// @ts-expect-error: return works
		task: async ({ $$ }, task) => {
			if(isCI) {
				return $({ shell: true, stdio: "inherit" })`${command}`;
			}

			const [commandName, args] = parseCommand(command, { getArgs: true });

			task.title = `Running "${command}"...`;

			const { exitCode, all, message } = await $$`${commandName} ${args}` as ExecaReturnValue & { all: string; message: string };

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
	} satisfies ListrTask<ListrContext>));

	return new Listr<ListrContext, "default", "verbose">(tasks, {
		exitOnError,
		rendererOptions: {
			timer: {
				...PRESET_TIMER,
				condition: showTimer,
			},
			collapseErrors: false,
			formatOutput: "wrap",
			removeEmptyLines: false,
		},
		silentRendererCondition: isCI,
		fallbackRenderer: "verbose",
		fallbackRendererCondition: process.env["NODE_ENV"] === "test",
		fallbackRendererOptions: {
			logTitleChange: true,
		},
		// Force color?
	});
};
