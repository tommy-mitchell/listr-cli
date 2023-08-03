import test from "ava";
import { getCommands } from "../../src/helpers/get-commands/get-commands.js";

type Command = {
	command: string;
	taskTitle?: string;
};

type MacroArgs = {
	commands: string[];
	expected: Command[];
};

const verifyCommands = test.macro(async (t, { commands, expected }: MacroArgs) => {
	const assertion = await t.try(tt => {
		tt.deepEqual(
			getCommands(commands),
			expected.map(({ command, taskTitle }) => ({ taskTitle: taskTitle ?? command, command })),
		);
	});

	if (!assertion.passed) {
		t.log("Tasks:", commands);
	}

	assertion.commit();
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
	] });

test("quoted tasks are treated as unnamed", verifyCommands, {
	commands: ["\"yarn run:ava\"", "'yarn run:ava'"],
	expected: [
		{ command: "yarn run:ava", taskTitle: "yarn" },
		{ command: "yarn run:ava", taskTitle: "yarn" },
	],
});

// TODO: unify difference between commands/tasks
