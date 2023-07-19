import test from "ava";
import { getCommands } from "../../src/helpers/get-commands.js";

type Command = {
	command: string;
	taskTitle?: string;
};

const verifyCommands = test.macro((t, input: string[], commands: Command[]) => {
	t.deepEqual(
		getCommands(input),
		commands.map(({ command, taskTitle }) => ({ taskTitle: taskTitle ?? command, command })),
	);
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
