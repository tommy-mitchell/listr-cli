import test from "ava";
import { trimIfNeeded } from "../../src/helpers/tasks/trim-if-needed.js";

type Expectations = {
	input: string;
	expected: string | Partial<{
		shouldTrim: boolean;
		output: string;
	}>;
};

const verifyTrim = test.macro((t, expectations: Expectations[]) => {
	for (const { input, expected: rawExpected } of expectations) {
		const expected = typeof rawExpected === "string" ? { output: rawExpected } : rawExpected;
		const passed = t.like(trimIfNeeded(input), expected);

		if (!passed) {
			t.log("input:", input);
			t.log("expected:", rawExpected);
		}
	}
});

test("trims strings with a single non-empty line", verifyTrim, [
	{ input: "foo\n", expected: "foo" },
	{ input: "\nfoo", expected: "foo" },
	{ input: "\nfoo\n", expected: "foo" },
	{ input: "\nfoo\n\n\n\n\n", expected: "foo" },
]);

test("preserves strings with multiple lines", verifyTrim, [
	{ input: "foo\nbar\n", expected: "foo\nbar\n" },
]);

test("has no effect on single-line or empty strings", verifyTrim, [
	{ input: "foo", expected: "foo" },
	{ input: "", expected: "" },
]);

test("sets shouldTrim property", verifyTrim, [
	{ input: "foo\n", expected: { shouldTrim: true } },
	{ input: "foo", expected: { shouldTrim: false } },
]);
