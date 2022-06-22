import {OdinModelConstructable, grid, wodinRun} from "../src/runner";
import {InternalStorage, UserType, checkUser, getUserScalar} from "../src/user";
import {ExMinimal} from "./models/minimal";
import {ExDelay} from "./models/delay";
import {ExUser} from "./models/user";
import {ExOutput} from "./models/output";
import {approxEqualArray} from "./helpers";

describe("checkUser", () => {
    const pars = new Map<string, number>([["a", 1], ["b", 2], ["c", 3]]);
    it("does no checking if ignored", () => {
        checkUser(pars, [], "ignore");
    });

    it("messages if unknown keys found", () => {
        console.log = jest.fn();
        checkUser(pars, ["a", "b"], "message");
        expect(console.log)
            .toHaveBeenCalledWith("Unknown user parameters: c");
        checkUser(pars, ["b"], "message");
        expect(console.log)
            .toHaveBeenCalledWith("Unknown user parameters: a, c");
    })

    it("warns if unknown keys found", () => {
        console.warn = jest.fn();
        checkUser(pars, ["a", "b"], "warning");
        expect(console.warn)
            .toHaveBeenCalledWith("Unknown user parameters: c");
    })

    it("error if unknown keys found", () => {
        expect(() => checkUser(pars, ["a", "b"], "stop"))
            .toThrow("Unknown user parameters: c");
        expect(() => checkUser(pars, ["b"], "stop"))
            .toThrow("Unknown user parameters: a, c");
        expect(() => checkUser(pars, ["a", "b", "c"], "stop"))
            .not.toThrow();
    })

    it("errors if invalid option given", () => {
        expect(() => checkUser(pars, ["a", "b"], "throw"))
            .toThrow("Unknown user parameters: c (and invalid value for unusedUserAction)");
        expect(() => checkUser(pars, ["a", "b", "c"], "throw"))
            .not.toThrow();
    })
});

describe("getUserScalar", () => {
    const pars = new Map<string, number>([["a", 1], ["b", 2.5], ["c", 3]]);
    it("Can retrieve a user value", () => {
        const internal = {} as InternalStorage;
        getUserScalar(pars, "a", internal, null, null, null, false);
        expect(internal["a"]).toEqual(1);
    });

    it("Can fall back on default value, erroring if unavailable", () => {
        const internal = {} as InternalStorage;
        getUserScalar(pars, "d", internal, 1, null, null, false);
        expect(internal["d"]).toEqual(1);
        expect(() => getUserScalar(pars, "d", internal, null, null, null, false))
            .toThrow("Expected a value for 'd'");
    });

    it("Can validate that the provided value satisfies constraints", () => {
        const internal = {} as InternalStorage;
        getUserScalar(pars, "a", internal, null, 0, 2, false);
        expect(internal["a"]).toEqual(1);
        expect(() => getUserScalar(pars, "a", internal, null, 2, 4, false))
            .toThrow("Expected 'a' to be at least 2");
        expect(() => getUserScalar(pars, "a", internal, null, -2, 0, false))
            .toThrow("Expected 'a' to be at most 0");
        expect(() => getUserScalar(pars, "b", internal, null, null, null, true))
            .toThrow("Expected 'b' to be integer-like");
    });
});

describe("grid", () => {
    it("Can produce an array of numbers", () => {
        expect(grid(0, 10, 6)).toEqual([0, 2, 4, 6, 8, 10]);
    });
});

describe("can run basic models", () => {
    it("runs minimal model with expected output", () => {
        const user = new Map<string, number>();
        const control : any = {};
        const result = wodinRun(ExMinimal, user, 0, 10, control);

        const y = result(0, 10, 11);
        const expectedT = grid(0, 10, 11);
        const expectedX = expectedT.map((t: number) => t + 1);
        expect(y.length).toEqual(1);
        expect(y[0].name).toEqual("x");
        expect(y[0].x).toEqual(expectedT);
        expect(approxEqualArray(y[0].y, expectedX)).toBe(true);
    });

    it("runs model with output, with expected output", () => {
        const user = new Map<string, number>([["a", 1]]);
        const control : any = {};
        const result = wodinRun(ExOutput, user, 0, 10, control);

        const y = result(0, 10, 11);
        const expectedT = grid(0, 10, 11);
        const expectedX = expectedT.map((t: number) => t + 1);
        const expectedY = expectedX.map((x: number) => x * 2);
        expect(y.length).toEqual(2);

        expect(y[0].name).toEqual("x");
        expect(y[0].x).toEqual(expectedT);
        expect(approxEqualArray(y[0].y, expectedX)).toBe(true);

        expect(y[1].name).toEqual("y");
        expect(y[1].x).toEqual(expectedT);
        expect(approxEqualArray(y[1].y, expectedY)).toBe(true);
    });

    it("runs delay model without error", () => {
        const user = new Map<string, number>();
        const control : any = {};
        const result = wodinRun(ExDelay, user, 0, 10, control);
    });
});

describe("can set user", () => {
    it("Agrees with mininal model", () => {
        const pars1 = new Map<string, number>();
        const pars2 = new Map<string, number>([["a", 1]]);
        const control : any = {};
        const result1 = wodinRun(ExMinimal, pars1, 0, 10, control);
        const result2 = wodinRun(ExUser, pars2, 0, 10, control);
        const y1 = result1(0, 10, 11);
        const y2 = result2(0, 10, 11);
        expect(y1).toEqual(y2);
    });

    it("Can pick up default values", () => {
        const pars1 = new Map<string, number>();
        const pars2 = new Map<string, number>([["a", 1]]);
        const control : any = {};
        const result1 = wodinRun(ExUser, pars1, 0, 10, control);
        const result2 = wodinRun(ExUser, pars2, 0, 10, control);
        const y1 = result1(0, 10, 11);
        const y2 = result2(0, 10, 11);
        expect(y1).toEqual(y2);
    });

    it("Varies by changing parameters", () => {
        const pars = new Map<string, number>([["a", 2]]);
        const control : any = {};
        const result = wodinRun(ExUser, pars, 0, 10, control);
        const y = result(0, 10, 11);
        const expectedX = grid(0, 10, 11);
        const expectedY = expectedX.map((t: number) => t * 2 + 1);
        expect(y.length).toEqual(1);
        expect(y[0].name).toEqual("x");
        expect(y[0].x).toEqual(expectedX);
        expect(approxEqualArray(y[0].y, expectedY)).toBe(true);
    })
});
