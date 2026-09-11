"use strict";
/**
 * analytics.ts
 * Pure utility functions for deriving workout analytics from Zustand state.
 * No UI, no side-effects — all functions are deterministic given the same inputs.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLocalDateKey = toLocalDateKey;
exports.calculateWorkoutStreak = calculateWorkoutStreak;
exports.calculateWeeklyVolume = calculateWeeklyVolume;
exports.e1RM = e1RM;
exports.derivePRsInSession = derivePRsInSession;
exports.calculatePersonalRecords = calculatePersonalRecords;
exports.formatVietnamDate = formatVietnamDate;
exports.formatVietnamShortDate = formatVietnamShortDate;
exports.formatTodayVietnamese = formatTodayVietnamese;
exports.getVietnameseGreeting = getVietnameseGreeting;
exports.calculateWeeklyWeightDelta = calculateWeeklyWeightDelta;
exports.durationMinutes = durationMinutes;
exports.calculateNutritionHistory = calculateNutritionHistory;
exports.calculateCalorieAdherence = calculateCalorieAdherence;
// ─────────────────────────────────────────────────
// LOCAL DATE HELPERS
// ─────────────────────────────────────────────────
/**
 * Returns a calendar date key using LOCAL time, formatted as YYYY-MM-DD.
 * Do NOT use toISOString() for calendar-day grouping because it converts to UTC.
 * In Vietnam (UTC+7), toISOString() can return the previous calendar day for
 * anything logged before 07:00 local time.
 */
function toLocalDateKey(d) {
    var date = typeof d === 'string' ? new Date(d) : d;
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return "".concat(y, "-").concat(m, "-").concat(day);
}
// ─────────────────────────────────────────────────
// STREAK CALCULATION
// ─────────────────────────────────────────────────
/**
 * Calculates the current consecutive training day streak.
 * Rules:
 * - Only COMPLETED sessions are counted.
 * - Multiple sessions on the same calendar day count as one training day.
 * - The streak starts from today and counts backwards.
 * - A gap of one or more days with no training breaks the streak.
 * - If there was no training today, the streak still includes yesterday if it was active.
 */
function calculateWorkoutStreak(history) {
    var completed = history.filter(function (s) { return s.status === 'COMPLETED' && s.start_time; });
    if (completed.length === 0)
        return 0;
    // Get unique training dates as YYYY-MM-DD strings in LOCAL time
    var trainingDates = new Set(completed.map(function (s) { return toLocalDateKey(s.start_time); }));
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var streak = 0;
    var cursor = new Date(today);
    // Allow yesterday as starting point if no session today
    var todayKey = toLocalDateKey(cursor);
    if (!trainingDates.has(todayKey)) {
        cursor.setDate(cursor.getDate() - 1);
    }
    while (true) {
        var key = toLocalDateKey(cursor);
        if (!trainingDates.has(key))
            break;
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}
// ─────────────────────────────────────────────────
// WEEKLY VOLUME CALCULATION
// ─────────────────────────────────────────────────
/** Returns "2026-W41" style ISO week key for a given date */
function isoWeekKey(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    var week1 = new Date(d.getFullYear(), 0, 4);
    var weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return "".concat(d.getFullYear(), "-W").concat(String(weekNum).padStart(2, '0'));
}
/** Returns monday–sunday date range label in Vietnamese short format */
function weekRangeLabel(weekKey, sessions) {
    var sessionsInWeek = sessions.filter(function (s) {
        var d = new Date(s.start_time);
        return isoWeekKey(d) === weekKey;
    });
    if (sessionsInWeek.length === 0)
        return weekKey;
    var dates = sessionsInWeek.map(function (s) { return new Date(s.start_time); });
    var minDate = new Date(Math.min.apply(Math, dates.map(function (d) { return d.getTime(); })));
    var maxDate = new Date(Math.max.apply(Math, dates.map(function (d) { return d.getTime(); })));
    var fmt = function (d) { return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }).replace('/', ' Th'); };
    return "".concat(fmt(minDate), " \u2013 ").concat(fmt(maxDate));
}
/**
 * Groups completed workout volumes by ISO calendar week.
 * Volume = sum of (weight × reps) across all COMPLETED sets for sessions in that week.
 * Returns the last N weeks (default 8), sorted oldest → newest for charting.
 */
function calculateWeeklyVolume(history, setHistory, maxWeeks) {
    var _a;
    if (maxWeeks === void 0) { maxWeeks = 8; }
    var completed = history.filter(function (s) { return s.status === 'COMPLETED' && s.start_time; });
    if (completed.length === 0)
        return [];
    // Build a map: sessionId → session
    var sessionMap = new Map(completed.map(function (s) { return [s.id, s]; }));
    // Group volume by week key
    var weekMap = new Map();
    for (var _i = 0, setHistory_1 = setHistory; _i < setHistory_1.length; _i++) {
        var set = setHistory_1[_i];
        if (set.status !== 'COMPLETED')
            continue;
        var session = sessionMap.get(set.session_id);
        if (!session)
            continue;
        var weekKey = isoWeekKey(new Date(session.start_time));
        var existing = (_a = weekMap.get(weekKey)) !== null && _a !== void 0 ? _a : { volume: 0, sessions: new Set() };
        existing.volume += set.weight * set.reps;
        existing.sessions.add(session.id);
        weekMap.set(weekKey, existing);
    }
    if (weekMap.size === 0)
        return [];
    // Sort weeks
    var sortedKeys = Array.from(weekMap.keys()).sort();
    var recentKeys = sortedKeys.slice(-maxWeeks);
    var volumes = recentKeys.map(function (k) { return weekMap.get(k).volume; });
    var maxVol = Math.max.apply(Math, __spreadArray(__spreadArray([], volumes, false), [1], false));
    return recentKeys.map(function (weekKey, idx) {
        var _a, _b;
        var data = weekMap.get(weekKey);
        var prevKey = recentKeys[idx - 1];
        var prevVol = (idx > 0 && prevKey) ? ((_b = (_a = weekMap.get(prevKey)) === null || _a === void 0 ? void 0 : _a.volume) !== null && _b !== void 0 ? _b : 0) : 0;
        var changeNum = idx > 0 && prevVol > 0 ? ((data.volume - prevVol) / prevVol) * 100 : null;
        return {
            weekLabel: weekRangeLabel(weekKey, completed),
            weekKey: weekKey,
            volume: Math.round(data.volume),
            sessions: data.sessions.size,
            pctOfMax: Math.round((data.volume / maxVol) * 100),
            change: changeNum !== null ? "".concat(changeNum >= 0 ? '+' : '').concat(changeNum.toFixed(1), "%") : null,
        };
    });
}
// ─────────────────────────────────────────────────
// PERSONAL RECORDS CALCULATION
// ─────────────────────────────────────────────────
/**
 * Estimated 1-Rep Max using the Epley formula.
 */
function e1RM(weight, reps) {
    if (!Number.isFinite(weight) || !Number.isFinite(reps))
        return 0;
    if (weight <= 0 || reps <= 0)
        return 0;
    if (reps === 1)
        return weight;
    return weight * (1 + reps / 30);
}
/**
 * Derives which active sets in a session are Personal Records.
 * Max 1 PR per exercise. Evaluates based on highest e1RM against historical best.
 */
function derivePRsInSession(activeSets, setHistory, workoutExercises) {
    var _a;
    var prIds = new Set();
    var weMap = new Map(workoutExercises.map(function (we) { return [we.id, we]; }));
    // Group active sets by exerciseId
    var sessionExerciseSets = new Map();
    for (var _i = 0, activeSets_1 = activeSets; _i < activeSets_1.length; _i++) {
        var s = activeSets_1[_i];
        if (s.status !== 'COMPLETED')
            continue;
        if (!Number.isFinite(s.weight) || s.weight <= 0)
            continue;
        if (!Number.isFinite(s.reps) || s.reps <= 0)
            continue;
        var we = weMap.get(s.workout_exercise_id);
        if (!we)
            continue;
        var exId = we.exercise_id;
        var arr = sessionExerciseSets.get(exId) || [];
        arr.push(s);
        sessionExerciseSets.set(exId, arr);
    }
    var currentSessionId = (_a = activeSets[0]) === null || _a === void 0 ? void 0 : _a.session_id;
    // Find historical best e1RM for each exercise
    var historicalBest = new Map();
    for (var _b = 0, setHistory_2 = setHistory; _b < setHistory_2.length; _b++) {
        var s = setHistory_2[_b];
        if (s.status !== 'COMPLETED')
            continue;
        if (currentSessionId && s.session_id === currentSessionId)
            continue;
        var we = weMap.get(s.workout_exercise_id);
        if (!we)
            continue;
        var exId = we.exercise_id;
        var e1 = e1RM(s.weight, s.reps);
        if (e1 > (historicalBest.get(exId) || 0)) {
            historicalBest.set(exId, e1);
        }
    }
    // Determine session PRs
    for (var _c = 0, _d = sessionExerciseSets.entries(); _c < _d.length; _c++) {
        var _e = _d[_c], exId = _e[0], sets = _e[1];
        var sessionBestSet = null;
        var maxSessionE1rm = 0;
        for (var i = 0; i < sets.length; i++) {
            var set = sets[i];
            if (!set)
                continue;
            var e1 = e1RM(set.weight, set.reps);
            if (e1 >= maxSessionE1rm) {
                maxSessionE1rm = e1;
                sessionBestSet = set; // Takes the latest tie-breaker
            }
        }
        if (sessionBestSet && maxSessionE1rm > 0) {
            var hBest = historicalBest.get(exId) || 0;
            if (maxSessionE1rm > hBest) {
                prIds.add(sessionBestSet.id);
            }
        }
    }
    return prIds;
}
/**
 * Derives the best-ever completed set per exercise from setHistory using e1RM.
 * Returns sorted by achieved date (most recent first).
 */
function calculatePersonalRecords(setHistory, workoutSessions, workoutExercises, exercises) {
    var prMap = new Map();
    var sessionMap = new Map(workoutSessions.map(function (s) { return [s.id, s]; }));
    var weMap = new Map(workoutExercises.map(function (we) { return [we.id, we]; }));
    for (var _i = 0, setHistory_3 = setHistory; _i < setHistory_3.length; _i++) {
        var set = setHistory_3[_i];
        if (set.status !== 'COMPLETED')
            continue;
        var we = weMap.get(set.workout_exercise_id);
        if (!we)
            continue;
        var exId = we.exercise_id;
        var currentE1RM = e1RM(set.weight, set.reps);
        if (currentE1RM <= 0)
            continue;
        var existing = prMap.get(exId);
        if (!existing || currentE1RM > existing.e1rm ||
            (currentE1RM === existing.e1rm && set.session_id !== existing.sessionId)) {
            prMap.set(exId, { bestSet: set, sessionId: set.session_id, e1rm: currentE1RM });
        }
    }
    var results = [];
    var _loop_1 = function (exerciseId, bestSet, sessionId) {
        var exercise = exercises.find(function (e) { return e.id === exerciseId; });
        var session = sessionMap.get(sessionId);
        if (!exercise || !session)
            return "continue";
        results.push({
            exerciseId: exerciseId,
            exerciseName: exercise.name,
            muscleGroup: exercise.primary_muscle,
            bestSet: bestSet,
            achievedAt: session.start_time,
            sessionId: sessionId,
        });
    };
    for (var _a = 0, _b = prMap.entries(); _a < _b.length; _a++) {
        var _c = _b[_a], exerciseId = _c[0], _d = _c[1], bestSet = _d.bestSet, sessionId = _d.sessionId;
        _loop_1(exerciseId, bestSet, sessionId);
    }
    return results.sort(function (a, b) { return b.achievedAt.localeCompare(a.achievedAt); });
}
// ─────────────────────────────────────────────────
// DATE FORMATTING UTILITIES
// ─────────────────────────────────────────────────
/** Formats an ISO date string into Vietnamese short date: "28 Th10 2026" */
function formatVietnamDate(isoString) {
    if (!isoString)
        return '';
    var d = new Date(isoString);
    if (isNaN(d.getTime()))
        return isoString;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
}
/** Formats an ISO date string into short Vietnamese: "28 Th10" */
function formatVietnamShortDate(isoString) {
    var d = new Date(isoString);
    if (isNaN(d.getTime()))
        return isoString;
    var day = d.getDate().toString().padStart(2, '0');
    var month = d.getMonth() + 1;
    return "".concat(day, " Th").concat(month);
}
/** Formats today's date in Vietnamese weekday + date format */
function formatTodayVietnamese() {
    var now = new Date();
    var weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    var weekday = weekdays[now.getDay()];
    var day = now.getDate().toString().padStart(2, '0');
    var month = now.getMonth() + 1;
    var year = now.getFullYear();
    return "".concat(weekday, ", ").concat(day, " Th").concat(month, " ").concat(year);
}
/**
 * Returns the time-of-day greeting in Vietnamese.
 */
function getVietnameseGreeting() {
    var h = new Date().getHours();
    if (h >= 5 && h < 12)
        return 'Chào buổi sáng';
    if (h >= 12 && h < 18)
        return 'Chào buổi chiều';
    return 'Chào buổi tối';
}
/**
 * Returns the weight delta over the last 7 days from WeightLog data.
 * Determines the latest log by date, then finds a comparison log ~7 days prior.
 * Returns null if insufficient data.
 */
function calculateWeeklyWeightDelta(logs) {
    if (logs.length < 2)
        return null;
    // 1. Parse dates using real data model formats
    var parsedLogs = logs.map(function (log) {
        var d;
        var dateStr = log.date;
        if (!dateStr)
            return { log: log, time: NaN, dateKey: '' };
        var viMatch = dateStr.match(/^(\d{1,2})\s+Th(\d{1,2})$/i);
        if (viMatch && viMatch[1] && viMatch[2]) {
            d = new Date(new Date().getFullYear(), parseInt(viMatch[2], 10) - 1, parseInt(viMatch[1], 10));
        }
        else {
            d = new Date("".concat(log.date, " ").concat(new Date().getFullYear()));
        }
        return { log: log, time: d.getTime(), dateKey: isNaN(d.getTime()) ? '' : toLocalDateKey(d) };
    }).filter(function (item) { return item.dateKey !== ''; });
    if (parsedLogs.length < 2)
        return null;
    // 2. Determine latest by actual time
    parsedLogs.sort(function (a, b) { return a.time - b.time; });
    var latestItem = parsedLogs[parsedLogs.length - 1];
    if (!latestItem)
        return null;
    // 3. Target local calendar date ~7 days before the latest log
    var latestDateObj = new Date(latestItem.time);
    latestDateObj.setDate(latestDateObj.getDate() - 7);
    var targetTime = latestDateObj.getTime();
    // 4. Find the most appropriate comparison log
    var bestItem = null;
    var minDiff = Infinity;
    for (var i = 0; i < parsedLogs.length - 1; i++) {
        var item = parsedLogs[i];
        if (!item)
            continue;
        var diffDays = Math.abs(item.time - targetTime) / (1000 * 60 * 60 * 24);
        if (diffDays < minDiff) {
            minDiff = diffDays;
            bestItem = item;
        }
    }
    // If closest is further than 4 days, it's not meaningful as a "weekly" delta
    if (!bestItem || minDiff > 4)
        return null;
    return Math.round((latestItem.log.weight - bestItem.log.weight) * 10) / 10;
}
/** Duration in minutes between two ISO strings */
function durationMinutes(startIso, endIso) {
    if (!endIso)
        return 0;
    return Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}
/**
 * Aggregates MealItems into a 7-day trailing historical array (including today).
 * Legacy items without a `logged_at` field are discarded to prevent artificially inflating
 * today's data and preserving strict day-to-day data accuracy.
 */
function calculateNutritionHistory(mealItems) {
    var history = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    // Initialize the past 7 days (index 6 is today, 0 is 6 days ago)
    for (var i = 6; i >= 0; i--) {
        var d = new Date(today);
        d.setDate(d.getDate() - i);
        var dateKey = toLocalDateKey(d);
        history.push({
            day: i === 0 ? 'Hôm Nay' : d.getDate().toString().padStart(2, '0'), // Simple day label for chart
            dateKey: dateKey,
            pro: 0,
            carb: 0,
            fat: 0,
            calories: 0,
            active: i === 0 // Mark today as active
        });
    }
    var _loop_2 = function (item) {
        // Legacy fallback: exclude items from before tracking
        if (!item.logged_at)
            return "continue";
        var itemDate = new Date(item.logged_at);
        var itemDateKey = toLocalDateKey(itemDate);
        // Find the matching day bin
        var targetBin = history.find(function (h) { return h.dateKey === itemDateKey; });
        if (targetBin) {
            targetBin.pro += item.protein;
            targetBin.carb += item.carbs;
            targetBin.fat += item.fat;
            targetBin.calories += item.calories;
        }
    };
    // Aggregate items
    for (var _i = 0, mealItems_1 = mealItems; _i < mealItems_1.length; _i++) {
        var item = mealItems_1[_i];
        _loop_2(item);
    }
    // Ensure exact rounding for chart display
    return history.map(function (h) { return (__assign(__assign({}, h), { pro: Math.round(h.pro), carb: Math.round(h.carb), fat: Math.round(h.fat), calories: Math.round(h.calories) })); });
}
function calculateCalorieAdherence(mealItems, user) {
    var _a;
    var history = calculateNutritionHistory(mealItems);
    var today = (_a = history[history.length - 1]) !== null && _a !== void 0 ? _a : { calories: 0, pro: 0, carb: 0, fat: 0, day: '', dateKey: '', active: false };
    var target = Number(user.target_calories);
    if (isNaN(target) || !isFinite(target) || target <= 0) {
        return {
            actual: today.calories,
            target: 0,
            percentage: 0,
            remaining: 0
        };
    }
    var pct = Math.round((today.calories / target) * 100);
    return {
        actual: today.calories,
        target: target,
        percentage: Math.min(100, pct),
        remaining: Math.max(0, target - today.calories)
    };
}
