const fs = require('fs');
const path = require('path');
const WorkerThreads = require('worker_threads');
const crypto = require('crypto');
const IGCParser = require('igc-parser');
const solver = require('./solver');
const util = require('./util');

const defaultConfig = {
    quiet: true,
    trim: true,
    env: { fs, WorkerThreads }
};

const tests = {
    FFVL: [
        { file: 'bigflat.igc', score: 224.09 },
        { file: 'd3p.igc', score: 60.77 },
        { file: 'fai.igc', score: 228.71, md5: '415ac5e167584bbcf93641fcbec7bbbb' },
        { file: 'fai.igc', score: 228.72, config: { hp: true } },
        { file: 'line.igc', score: 53.34, md5: 'f34917458bb110ca34be92439a2ca9de' },
        { file: 'tri.igc', score: 17.51 },
        { file: 'record_de_france.igc', score: 422.02 },
        { file: 'record_de_france.igc', score: 421.99, config: { hp: true } },
        { file: 'zigzag.igc', score: 90.64 },
        { file: 'flat-ffvl-26.37.igc', score: 26.4 },
        { file: 'curvature-of-earth-triangle.igc', score: 90.71 },
        { file: 'vincentys.igc', score: 174.35 },
        { file: 'discontinuity.igc', score: 53.01 },
        { file: 'hiking-up.igc', score: 40.53 },
        { file: 'hiking-up-2.igc', score: 125.94 },
        { file: 'lunch-break.igc', score: 73.92 },
        { file: 'dup-fixes.igc', score: 89.1 }
    ],
    XContest: [
        { file: 'flat-xcontest-106.82.igc', score: 107.12 },
        { file: 'trifai-xcontest-362.70.igc', score: 363.43 },
        { file: 'trifai-xcontest-362.70.igc', score: 363.42, config: { hp: true } },
        { file: 'freeflight-xcontest-66.46.igc', score: 66.5 },
        { file: 'flat-xcontest-100.59.igc', score: 100.76 },
        { file: 'flat-xcontest-8.01.igc', score: 8.01 },
        { file: 'trifai-xcontest-189.65.igc', score: 189.96 },
        { file: 'trifai-xcontest-189.65.igc', score: 189.96, config: { hp: true } },
        { file: 'trifai-xcontest-452.21.igc', score: 453.04 },
        { file: 'trifai-xcontest-452.21.igc', score: 453.02, config: { hp: true } },
        { file: 'trifai-xcontest-307.57.igc', score: 308.26 },
        { file: 'freeflight-xcontest-465.33.igc', score: 465.58 },
        { file: 'opentri-xcontest-428.31.igc', score: 428.59 }
    ]
};

(async () => {
    for (let rules of Object.keys(tests))
        for (let test of tests[rules]) {
            const flight = IGCParser.parse(fs.readFileSync(path.join('test', test.file), 'utf8'), { lenient: true });
            const ts = Date.now();
            const best = (await solver(flight, rules, { ...defaultConfig, ...test.config }).next()).value;
            if (best.score == test.score)
                console.log(rules, test.file,
                    (test.config || {}).hp ? 'HP' : 'Fast', best.score,
                    (Date.now() - ts) + 'ms',
                    util.consoleColors.fg.green + String.fromCodePoint(0x2713) + util.consoleColors.reset);
            else {
                console.error(rules, test.file, test.score, best.score,
                    util.consoleColors.fg.red + 'x' + util.consoleColors.reset);
                if (process.argv[2] !== 'force')
                    process.exit(1);
            }
            if (test.md5) {
                const hash = crypto.createHash('md5');
                const geojson = best.geojson(flight);
                /* These are timing-dependent when multithreading */
                delete geojson.properties.processedTime;
                delete geojson.properties.processedSolutions;
                delete geojson.properties.id;
                hash.update(JSON.stringify(geojson));
                const digest = hash.digest('hex');
                if (digest !== test.md5) {
                    console.error(rules, test.file, digest, test.md5);
                    if (process.argv[2] !== 'force')
                        process.exit(1);
                }
            }
        }
})().then(() => {
    process.exit(0);
}).catch((e) => {
    console.error('Failing with exception ', e);
    process.exit(1);
});