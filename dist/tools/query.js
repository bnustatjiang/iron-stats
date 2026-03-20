"use strict";
var path = require("path");
var fs = require("fs");
exports.queryStats = async function(dataDir, params) {
  var records = JSON.parse(fs.readFileSync(path.join(dataDir, "workouts.json"), "utf-8"));
  if (params && params.days) {
    var cutoff = Date.now() - Number(params.days) * 86400000;
    records = records.filter(function(r){ return new Date(r.date).getTime() >= cutoff; });
  }
  if (params && params.exercise) {
    records = records.filter(function(r){ return r.exercise.toLowerCase() === params.exercise.toLowerCase(); });
  }
  var byEx = {};
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    if (!byEx[r.exercise]) byEx[r.exercise] = { best: 0, totalSets: 0, totalReps: 0, sessions: 0 };
    byEx[r.exercise].best = Math.max(byEx[r.exercise].best, Number(r.weight));
    byEx[r.exercise].totalSets += Number(r.sets);
    byEx[r.exercise].totalReps += Number(r.sets) * Number(r.reps);
    byEx[r.exercise].sessions += 1;
  }
  var stats = Object.keys(byEx).map(function(name){ var s = byEx[name]; return { exercise: name, bestWeight: s.best, totalSets: s.totalSets, totalReps: s.totalReps, sessions: s.sessions }; });
  return { total: records.length, stats: stats, records: records.slice(-10).reverse() };
};