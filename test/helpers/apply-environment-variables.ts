/* eslint-disable @typescript-eslint/naming-convention */
import process from "node:process";
import anyTest, { type TestFn } from "ava";
import { applyEnvironmentVariables } from "../../src/helpers/apply-environment-variables.js";

const test = anyTest as TestFn<{
	originalProcessEnv: typeof process["env"];
}>;

test.beforeEach("reset process.env", t => {
	t.context.originalProcessEnv = process.env;
	process.env = {};
});

test.after("reapply process.env", t => {
	process.env = t.context.originalProcessEnv;
});

test.serial("separates by ,", t => {
	applyEnvironmentVariables(["A,B,C,D"]);

	t.deepEqual(
		Object.keys(process.env),
		["A", "B", "C", "D"],
	);
});

test.serial("processes an array of env vars", t => {
	applyEnvironmentVariables(["A", "B", "C", "D"]);

	t.deepEqual(
		Object.keys(process.env),
		["A", "B", "C", "D"],
	);
});

test.serial("sets env vars without a : to true", t => {
	applyEnvironmentVariables(["A", "B"]);

	t.deepEqual(
		process.env,
		{ A: "true", B: "true" },
	);
});

test.serial("splits and sets env vars with a : to the split value", t => {
	applyEnvironmentVariables(["A:foo", "B:bar"]);

	t.deepEqual(
		process.env,
		{ A: "foo", B: "bar" },
	);
});
