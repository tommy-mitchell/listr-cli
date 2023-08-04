import process from "node:process";
import { Listr, PRESET_TIMER, type ListrTask } from "listr2";
import { $, type ExecaReturnValue } from "execa";
import { isCI } from "ci-info";
import { type Command, trimIfNeeded } from "./helpers/index.js";

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
	persistentOutput: boolean;
};

export const getTasks = ({ commands, exitOnError, showTimer, persistentOutput }: TaskContext) => {
	const tasks: Array<ListrTask<ListrContext>> = [];

	for (const { taskTitle, command } of commands) {
		tasks.push({
			title: taskTitle,
			// @ts-expect-error: return works
			task: async ({ $$ }, task) => {
				if (isCI) {
					return $({ shell: true, stdio: "inherit" })`${command}`;
				}

				const executeCommand = $$`${command}`;

				executeCommand.stdout?.pipe(task.stdout());
				executeCommand.stderr?.pipe(task.stdout());

				task.title += `: running "${command}"...`;

				const { exitCode, all, message } = await executeCommand as ExecaReturnValue & { all: string; message: string };

				if (exitCode === 127 || message?.includes("ENOENT")) {
					task.title = taskTitle === command
						? `${taskTitle}: command not found.`
						: `${taskTitle}: command "${command}" not found.`;

					task.output = "";
					endTask();
				}

				task.title = taskTitle;
				const { shouldTrim, output } = trimIfNeeded(all);

				if (shouldTrim) {
					task.output = output;
				}

				if (exitCode !== 0) {
					endTask();
				}
			},
			options: {
				persistentOutput,
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
			showErrorMessage: false,
			collapseErrors: false,
			formatOutput: "wrap",
			removeEmptyLines: false,
		},
		silentRendererCondition: isCI,
		fallbackRenderer: "verbose", // TODO: maybe use test renderer, it can log failed states
		fallbackRendererCondition: process.env["NODE_ENV"] === "test",
		fallbackRendererOptions: {
			logTitleChange: true,
		},
	});
};
