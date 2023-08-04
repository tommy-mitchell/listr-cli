import process from "node:process";
import { Listr, PRESET_TIMER, type ListrTask } from "listr2";
import { $, type ExecaReturnValue } from "execa";
import { isCI } from "ci-info";
import LineTransformStream from "line-transform-stream";
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

				task.title += `: running "${command}"...`;
				const executeCommand = $$`${command}`;

				executeCommand.all?.pipe(new LineTransformStream(line => {
					if (line.includes("command not found")) {
						task.title = taskTitle === command
							? `${taskTitle}: command not found.`
							: `${taskTitle}: command "${command}" not found.`;

						endTask();
					}

					return line;
				})).pipe(task.stdout());

				const { exitCode, all } = await executeCommand as ExecaReturnValue & { all: string };

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
