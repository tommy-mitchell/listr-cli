/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-definitions */

// From https://github.com/total-typescript/ts-reset/pull/110

type Split<Splitter extends string, Limit extends number> = (
	Limit extends 0
		? []
		: Splitter extends ""
			? string[]
			: [string, ...string[]]
);

interface String {
	split<Splitter extends string, Limit extends number>(
		splitter: { [Symbol.split](string: Splitter, limit?: number): Split<Splitter, Limit> },
		limit?: Limit
	): Split<Splitter, Limit>;

	split<Seperator extends string, Limit extends number>(
		seperator: Seperator,
		limit?: Limit
	): Split<Seperator, Limit>;
}
