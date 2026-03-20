"use strict";
var path = require("path");
var fs = require("fs");
function getPeriodRecords(records, period) {
  var now = new Date();
  if (period === "week") {
    var wStart = new Date(now); wStart.setDate(now.getDate() - 7);
    return records.filter(function(r){ return new Date(r.date) >= wStart; });
  } else if (period === "month") {
    var mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return records.filter(function(r){ return new Date(r.date) >= mStart; });
  }
  return records;
}
exports.generateReport = async function(dataDir, period) {
  period = period || "month";
  var allRecords = JSON.parse(fs.readFileSync(path.join(dataDir, "workouts.json"), "utf-8"));
  var records = getPeriodRecords(allRecords, period);
  var byEx = {};
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    if (!byEx[r.exercise]) byEx[r.exercise] = { best: 0, totalSets: 0 };
    byEx[r.exercise].best = Math.max(byEx[r.exercise].best, Number(r.weight));
    byEx[r.exercise].totalSets += Number(r.sets);
  }
  var now = new Date();
  var periodLabel = period === "week" ? "本周" : period === "month" ? "本月" : "全部";
  var labels = Object.keys(byEx);
  var values = labels.map(function(k){ return byEx[k].best; });
  var rows = records.slice().reverse().map(function(r) {
    return "<tr><td>" + new Date(r.date).toLocaleDateString("zh-CN") + "</td><td>" + r.exercise + "</td><td>" + r.weight + " kg</td><td>" + r.sets + "×" + r.reps + "</td><td>" + (r.note||"—") + "</td></tr>";
  }).join("\n    ");
  var html = "<!DOCTYPE html><html lang=\"zh\"><head><meta charset=\"utf-8\"><title>IronStats 训练报告 - " + periodLabel + "</title><script src=\"https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js\"></script><style>body{font-family:system-ui,sans-serif;padding:24px;background:#1a1a2e;color:#eee} h1{color:#e94560;font-size:28px;margin-bottom:4px} .subtitle{color:#aaa;font-size:14px;margin-bottom:32px} .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px} .card{background:#16213e;border-radius:12px;padding:20px} .card h3{color:#e94560;font-size:14px;margin:0 0 8px 0} .card p{font-size:28px;font-weight:bold;margin:0;color:#fff} table{width:100%;border-collapse:collapse;background:#16213e;border-radius:12px;overflow:hidden} th{background:#0f3460;padding:12px 16px;color:#e94560;text-align:left} td{padding:12px 16px;border-bottom:1px solid #1a1a2e} tr:last-child td{border:none}</style></head><body><h1>🏋️ IronStats 训练报告</h1><p class=\"subtitle\">" + periodLabel + "概览 · " + now.toLocaleDateString("zh-CN") + "</p><div class=\"summary\"><div class=\"card\"><h3>总训练次数</h3><p>" + records.length + " 次</p></div><div class=\"card\"><h3>覆盖动作</h3><p>" + labels.length + " 个</p></div><div class=\"card\"><h3>累计组数</h3><p>" + records.reduce(function(s,r){return s+Number(r.sets);},0) + " 组</p></div></div><h2 style=\"color:#e94560\">📈 各动作最佳重量（kg）</h2><canvas id=\"chart\" style=\"margin-bottom:32px;max-height:260px\"></canvas><h2 style=\"color:#e94560\">📋 详细记录</h2><table><thead><tr><th>日期</th><th>动作</th><th>重量</th><th>组×次数</th><th>备注</th></tr></thead><tbody>" + rows + "</tbody></table><script>new Chart(document.getElementById('chart'),{type:'bar',data:{labels:JSON.parse('"+JSON.stringify(labels)+"'),datasets:[{label:'最佳重量(kg)',data:JSON.parse('"+JSON.stringify(values)+"'),backgroundColor:'#e94560'}]}},{responsive:true,plugins:{legend:{display:false}}})</script></body></html>";
  var outDir = path.join(dataDir, "reports");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  var outFile = path.join(outDir, "report-" + period + "-" + Date.now() + ".html");
  fs.writeFileSync(outFile, html);
  return outFile;
};