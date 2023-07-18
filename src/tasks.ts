import process from "node:process";
import { Listr, PRESET_TIMER, type ListrTask } from "listr2";
import { $, type ExecaReturnValue } from "execa";
import { isCI } from "ci-info";
import { type Command, trimIfNeeded } from "./helpers.js";

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
	commands: Command[];
	exitOnError: boolean;
	showTimer: boolean;
};

export const getTasks = ({ commands, exitOnError, showTimer }: TaskContext) => {
	const tasks: Array<ListrTask<ListrContext>> = [];

	for (const { taskTitle, command } of commands) {
		tasks.push({
			title: taskTitle,
			// @ts-expect-error: return works
			task: async ({ $$ }, task) => {
				if (isCI) {
					return $({ shell: true, stdio: "inherit" })`${command}`;
				}

				task.title += `: running "${command}"...`;

				const { exitCode, all, message } = await $$`${command}` as ExecaReturnValue & { all: string; message: string };

				if (exitCode === 127 || message?.includes("ENOENT")) {
					task.title = taskTitle === command
						? `${taskTitle}: command not found.`
						: `${taskTitle}: command "${command}" not found.`;

					endTask();
				}

				task.title = taskTitle;

				if (exitCode !== 0) {
					endTask(trimIfNeeded(all));
				}

				task.output = trimIfNeeded(all);
			},
			options: {
				persistentOutput: true,
			},
		});
	}

	return new Listr<ListrContext, "default", "verbose">(tasks, {
		exitOnError,
		forceColor: true,
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
	});
};
