import * as base from "./base";
import type { OdinModelConstructable, Solution } from "./model";
import {runModel} from "./model";
import type { UserType } from "./user";

// tslint:disable-next-line:variable-name
export function wodinRun(Model: OdinModelConstructable, pars: UserType,
                         tStart: number, tEnd: number,
                         control: any) {
    const model = new Model(base, pars, "error");
    const solution = runModel(model, tStart, tEnd, control).solution;
    const names = model.names();
    return (t0: number, t1: number, nPoints: number) => {
        const t = grid(Math.max(0, t0), Math.min(t1, tEnd), nPoints);
        const y = solution(t);
        return y[0].map((_: any, i: number) => ({
            name: names[i], x: t, y: y.map((row: number[]) => row[i])}));
    };
}

export function grid(a: number, b: number, len: number) {
    const dx = (b - a) / (len - 1);
    const x = [];
    for (let i = 0; i < len - 1; ++i) {
        x.push(a + i * dx);
    }
    x.push(b);
    return x;
}
