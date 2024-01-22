import process from "node:process";
import type { TupleToUnion } from "type-fest";
import { Listr, PRESET_TIMER, type ListrTask, type DefaultRenderer } from "listr2";
import { type $, type ExecaReturnValue } from "execa";
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
	ci: typeof $;
};

export const outputTypes = ["all", "last"] as const;
export type OutputType = TupleToUnion<typeof outputTypes>;

type TaskContext = {
	commands: Command[];
	exitOnError: boolean;
	showTimer: boolean;
	persistentOutput: boolean;
	outputType: OutputType;
};

export const getTasks = ({ commands, exitOnError, showTimer, persistentOutput, outputType }: TaskContext) => {
	const tasks: Array<ListrTask<ListrContext, typeof DefaultRenderer>> = [];

	for (const { taskTitle, command, commandName } of commands) {
		tasks.push({
			title: taskTitle,
			// @ts-expect-error: return works
			task: async ({ $$, ci }, task) => {
				if (isCI) {
					return ci`${command}`;
				}

				task.title += `: running "${command}"...`;
				const executeCommand = $$`${command}`;

				let commandNotFound = false;

				// TODO: createWriteable
				// https://listr2.kilic.dev/task/output.html#render-output-of-a-command
				executeCommand.all?.pipe(new LineTransformStream(line => {
					if (line.match(new RegExp(`${commandName}.*not found`))) {
						task.title = taskTitle === command
							? `${taskTitle}: command not found.`
							: `${taskTitle}: command "${command}" not found.`;

						commandNotFound = true;
						return "";
					}

					return line;
				})).pipe(task.stdout());

				const { exitCode, all } = await executeCommand as ExecaReturnValue & { all: string };

				if (commandNotFound) {
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
			rendererOptions: {
				persistentOutput,
				outputBar: outputType === "all" ? Number.POSITIVE_INFINITY : true,
			},
		});
	}

	return new Listr<ListrContext, "default", "verbose">(tasks, {
		exitOnError,
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
