"use strict";
var path = require("path");
var fs = require("fs");
exports.deleteRecord = async function(dataDir, recordId) {
  var file = path.join(dataDir, "workouts.json");
  var records = JSON.parse(fs.readFileSync(file, "utf-8"));
  var idx = -1;
  for (var i = 0; i < records.length; i++) { if (records[i].id === recordId) { idx = i; break; } }
  if (idx === -1) return { success: false, message: "❌ 未找到该记录" };
  var removed = records.splice(idx, 1)[0];
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
  return { success: true, message: "✅ 已删除：" + removed.exercise + " " + removed.weight + "kg × " + removed.sets + "组×" + removed.reps + "次" };
};
exports.listRecords = async function(dataDir, limit) {
  var file = path.join(dataDir, "workouts.json");
  var records = JSON.parse(fs.readFileSync(file, "utf-8"));
  return records.slice(-limit).reverse();
};