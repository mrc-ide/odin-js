import {Solution} from "./model";

export function delay(solution: Solution, t: number, index: number[],
                      state: number[]) {
    // Later, we'll update dopri.js to allow passing index here,
    // which will make this more efficient. However, no change to
    // the external interface will be neeed.
    const y = solution(t);
    for (let i = 0; i < index.length; ++i) {
        state[i] = y[index[i]];
    }
}
