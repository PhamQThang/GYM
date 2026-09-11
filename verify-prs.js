"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var analytics_1 = require("./src/lib/analytics");
var assert_1 = __importDefault(require("assert"));
var exId = 'ex-1';
var weId = 'we-1';
var ses1 = 's-1';
var ses2 = 's-2';
var workoutExercises = [{ id: weId, exercise_id: exId }];
var historySets = [
    { id: '1', session_id: ses1, workout_exercise_id: weId, weight: 100, reps: 5, status: 'COMPLETED' }, // e1RM = 100 * (1 + 5/30) = 116.66...
    { id: '2', session_id: ses1, workout_exercise_id: weId, weight: 110, reps: 1, status: 'COMPLETED' } // e1RM = 110
];
var activeSets = [
    { id: '3', session_id: ses2, workout_exercise_id: weId, weight: 105, reps: 5, status: 'COMPLETED' }, // e1RM = 122.5
    { id: '4', session_id: ses2, workout_exercise_id: weId, weight: 105, reps: 5, status: 'COMPLETED' } // e1RM = 122.5 (tie)
];
function runTests() {
    console.log("--- TEST 1: derivePRsInSession (Active Workout) ---");
    var prs1 = (0, analytics_1.derivePRsInSession)(activeSets, historySets, workoutExercises);
    console.log("PRs mapped:", Array.from(prs1));
    assert_1.default.strictEqual(prs1.size, 1, "Max 1 PR per exercise/session");
    assert_1.default.strictEqual(prs1.has('4'), true, "Ties should resolve deterministically to the later set");
    console.log("--- TEST 2: derivePRsInSession (Past Workout viewing) ---");
    // Past workout viewing provides ALL history including the session itself
    var allHistory = __spreadArray(__spreadArray([], historySets, true), activeSets, true);
    var prs2 = (0, analytics_1.derivePRsInSession)(activeSets, allHistory, workoutExercises);
    assert_1.default.strictEqual(prs2.size, 1, "Should correctly exclude itself from historical baseline");
    assert_1.default.strictEqual(prs2.has('4'), true, "Ties should resolve deterministically to the later set filter");
    console.log("--- TEST 3: calculatePersonalRecords ---");
    var allPRs = (0, analytics_1.calculatePersonalRecords)(allHistory, [{ id: ses1 }, { id: ses2 }], workoutExercises, [{ id: exId, name: 'Bench' }]);
    console.log("Calculated PRs count:", allPRs.length);
    assert_1.default.strictEqual(allPRs.length, 2, "Should have 2 discrete PR achievements over time");
    console.log("--- All Tests Passed Successfully ---");
}
try {
    runTests();
    process.exit(0);
}
catch (e) {
    console.error("Test failed:", e);
    process.exit(1);
}
