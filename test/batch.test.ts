import { batchParsDisplace, batchParsRange, batchRun, updatePars } from "../src/batch";
import { grid, gridLog } from "../src/util";
import { wodinRun } from "../src/wodin";

import { User } from "./models";

describe("Can generate sensible sets of parameters", () => {
    it("Generates a simple sequence", () => {
        const user = new Map<string, number>([["a", 1], ["b", 2]]);
        const res = batchParsRange(user, "a", 5, false, 0, 2);
        expect(res.base).toBe(user);
        expect(res.name).toBe("a");
        expect(res.values).toEqual(grid(0, 2, 5));
    });

    it("Generates a logarithmic sequence", () => {
        const user = new Map<string, number>([["a", 1], ["b", 2]]);
        const res = batchParsRange(user, "a", 5, true, 0.5, 1.5);
        expect(res.base).toBe(user);
        expect(res.name).toBe("a");
        expect(res.values).toEqual(gridLog(0.5, 1.5, 5));
    });

    it("Generates a displaced sequence", () => {
        const user = new Map<string, number>([["a", 1], ["b", 2]]);
        const res = batchParsDisplace(user, "b", 5, false, 50);
        expect(res.base).toBe(user);
        expect(res.name).toBe("b");
        expect(res.values).toEqual(grid(1, 3, 5));
    });

    it("Requires that central values lie within the requested range", () => {
        const user = new Map<string, number>([["a", 1], ["b", 2]]);
        expect(() => batchParsRange(user, "a", 5, false, 3, 4))
            .toThrow("Expected lower bound to be no greater than 1");
        expect(() => batchParsRange(user, "a", 5, false, -2, -1))
            .toThrow("Expected upper bound to be no less than 1");
        expect(() => batchParsRange(user, "a", 5, false, 1, 1))
            .toThrow("Expected upper bound to be greater than lower bound");
    })

    it("Requires that we have at least two points in the range", () => {
        const user = new Map<string, number>([["a", 1], ["b", 2]]);
        expect(() => batchParsRange(user, "a", 1, false, 0, 2))
            .toThrow("Must include at least 2 traces in the batch");
    });

    it("Requires that the updated parameter exists", () => {
        const user = new Map<string, number>([["a", 1], ["b", 2]]);
        expect(() => batchParsRange(user, "c", 5, false, 0, 2))
            .toThrow("Expected a value for 'c'");
    });

    it("Requires a scalar for the updated parameter", () => {
        const user = new Map<string, number | number[]>([["a", [1, 2]]]);
        expect(() => batchParsRange(user, "a", 5, false, 0, 2))
            .toThrow("Expected a number for 'a'");
    });

    it("Updates parameter values correctly", () => {
        const user = new Map<string, number>([["a", 1], ["b", 2]]);
        const p = updatePars(user, "a", 3);
        expect(p.get("a")).toBe(3);
        expect(p.get("b")).toBe(2);
    });
});

describe("run sensitivity", () => {
    it("runs without error", () => {
        const user = new Map<string, number>([["a", 2]]);
        const pars = batchParsRange(user, "a", 5, false, 0, 4);
        const control = {};
        const tStart = 0;
        const tEnd = 10;
        const res = batchRun(User, pars, tStart, tEnd, control);

        const central = wodinRun(User, user, tStart, tEnd, control);
        const lower = wodinRun(User, new Map<string, number>([["a", 0]]),
                               tStart, tEnd, control);
        const upper = wodinRun(User, new Map<string, number>([["a", 4]]),
                               tStart, tEnd, control);
        const n = 11;
        expect(res[2](tStart, tEnd, n)).toEqual(central(tStart, tEnd, n));
        expect(res[0](tStart, tEnd, n)).toEqual(lower(tStart, tEnd, n));
        expect(res[4](tStart, tEnd, n)).toEqual(upper(tStart, tEnd, n));
    });
});