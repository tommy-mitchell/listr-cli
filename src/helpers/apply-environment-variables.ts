import process from "node:process";

// Parse environment variables, based on https://github.com/rollup/rollup/blob/master/cli/run/index.ts#L42-L53
export const applyEnvironmentVariables = (environment: string[]) => {
	for (const argument of environment) {
		for (const pair of argument.split(",")) {
			const [key, ...value] = pair.split(":");

			process.env[key] = value.length === 0 ? String(true) : value.join(":");
		}
	}
};
