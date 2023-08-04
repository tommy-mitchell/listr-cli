import test from "ava";
import { getCommands } from "../../src/helpers/get-commands/get-commands.js";

type Command = {
	command: string;
	taskTitle?: string;
	commandName?: string;
};

type MacroArgs = {
	commands: string[];
	expected: Command[];
};

const verifyCommands = test.macro((t, { commands, expected: expectations }: MacroArgs) => {
	for (const actual of getCommands(commands)) {
		const expected = expectations.shift()!;

		const passed = t.like(actual, {
			...expected,
			taskTitle: expected.taskTitle ?? expected.command,
		});

		if (!passed) {
			t.log("Task:", actual);
			t.log("Expected:", expected);
		}
	}
});

test("splits command name and args", verifyCommands, {
	commands: ["xo", "ava --tap", "tsd"],
	expected: [
		{ command: "xo" },
		{ command: "ava --tap", taskTitle: "ava" },
		{ command: "tsd" },
	],
});

test("named tasks via ::", verifyCommands, {
	commands: ["lint::xo"],
	expected: [
		{ command: "xo", taskTitle: "lint" },
	],
});

test("named tasks with regular tasks", verifyCommands, {
	commands: ["lint::xo", "ava", "echo '1 2 3 4'"],
	expected: [
		{ command: "xo", taskTitle: "lint" },
		{ command: "ava" },
		{ command: "echo '1 2 3 4'", taskTitle: "echo" },
	],
});

test("named tasks ignore single : in command", verifyCommands, {
	commands: ["tests::yarn run:ava:watch"],
	expected: [
		{ command: "yarn run:ava:watch", taskTitle: "tests" },
	],
});

test("allows spaces in task title and command", verifyCommands, {
	commands: ["run tests::ava --watch"],
	expected: [
		{ command: "ava --watch", taskTitle: "run tests" },
	],
});

test("quoted tasks are treated as unnamed", verifyCommands, {
	commands: ["\"yarn run:ava\"", "'yarn run:ava'"],
	expected: [
		{ command: "yarn run:ava", taskTitle: "yarn" },
		{ command: "yarn run:ava", taskTitle: "yarn" },
	],
});

test("parses command named", verifyCommands, {
	commands: ["lint::xo", "tests::yarn run:ava:watch", "tsd"],
	expected: [
		{ command: "xo", taskTitle: "lint", commandName: "xo" },
		{ command: "yarn run:ava:watch", taskTitle: "tests", commandName: "yarn" },
		{ command: "tsd", taskTitle: "tsd", commandName: "tsd" },
	],
});

// TODO: unify difference between commands/tasks
