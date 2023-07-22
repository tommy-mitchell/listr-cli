import test from "ava";
import { getCommands } from "../../src/helpers/get-commands.js";

type Command = {
	command: string;
	taskTitle?: string;
};

const verifyCommands = test.macro(async (t, input: string[], commands: Command[]) => {
	const assertion = await t.try(tt => {
		tt.deepEqual(
			getCommands(input),
			commands.map(({ command, taskTitle }) => ({ taskTitle: taskTitle ?? command, command })),
		);
	});

	if (!assertion.passed) {
		t.log("Input:", input);
	}

	assertion.commit();
});

test("splits command name and args", verifyCommands, ["xo", "ava --tap", "tsd"], [
	{ command: "xo" },
	{ command: "ava --tap", taskTitle: "ava" },
	{ command: "tsd" },
]);

test("named tasks via :", verifyCommands, ["lint:xo"], [
	{ command: "xo", taskTitle: "lint" },
]);

test("named tasks with regular tasks", verifyCommands, ["lint:xo", "ava", "echo '1 2 3 4'"], [
	{ command: "xo", taskTitle: "lint" },
	{ command: "ava" },
	{ command: "echo '1 2 3 4'", taskTitle: "echo" },
]);

test("named tasks with : in the command", verifyCommands, ["tests:yarn run:ava:watch"], [
	{ command: "yarn run:ava:watch", taskTitle: "tests" },
]);

test("allows spaces in task title and command", verifyCommands, ["run tests:ava --watch"], [
	{ command: "ava --watch", taskTitle: "run tests" },
]);

test("quoted tasks are treated as unnamed", verifyCommands, ["\"yarn run:ava\"", "'yarn run:ava'"], [
	{ command: "yarn run:ava", taskTitle: "yarn" },
	{ command: "yarn run:ava", taskTitle: "yarn" },
]);
