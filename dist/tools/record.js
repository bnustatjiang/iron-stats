"use strict";
const path = require("path");
const fs = require("fs");

function readLog(dataDir) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, "workouts.json"), "utf-8"));
}
function writeLog(dataDir, records) {
  fs.writeFileSync(path.join(dataDir, "workouts.json"), JSON.stringify(records, null, 2));
}

exports.recordWorkout = async function(dataDir, params) {
  const records = readLog(dataDir);
  const record = {
    id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    date: new Date().toISOString(),
    exercise: params.exercise,
    sets: Number(params.sets),
    reps: Number(params.reps),
    weight: Number(params.weight),
    note: params.note || "",
  };
  records.push(record);
  writeLog(dataDir, records);
  return { success: true, record, message: `✅ 已记录：${params.exercise} ${params.weight}kg × ${params.sets}组×${params.reps}次` };
};
