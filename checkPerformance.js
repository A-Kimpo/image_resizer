export const functionRuns = {};
export default (foo) => async (...args) => {
        const t1 = performance.now();
        await foo(...args);
        const t2 = performance.now();

        const timeInSec = `${((t2 - t1) / 1000).toFixed(2)}s`;


        if (!functionRuns[foo.name]) {
                functionRuns[foo.name] = { counts: 1, time: timeInSec };
        } else {
                const timeNew = Number(timeInSec.slice(0, timeInSec.length - 1));
                const timePrev = Number(functionRuns[foo.name].time.slice(0, functionRuns[foo.name].time.length - 1));

                functionRuns[foo.name].counts += 1;
                functionRuns[foo.name].time = `${(timePrev + timeNew).toFixed(2)}s`;
                functionRuns[foo.name].average_time = `${(timePrev / functionRuns[foo.name].counts).toFixed(2)}s`;
        }
};
