import path from "path";
import fs from "fs";

interface WorkoutRecord {
  id: string;
  date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  note?: string;
}

function readLog(dataDir: string): WorkoutRecord[] {
  return JSON.parse(fs.readFileSync(path.join(dataDir, "workouts.json"), "utf-8"));
}

function getPeriodRecords(records: WorkoutRecord[], period: string) {
  const now = new Date();
  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return records.filter((r) => new Date(r.date) >= start);
  } else if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return records.filter((r) => new Date(r.date) >= start);
  }
  return records;
}

export async function generateReport(
  dataDir: string,
  period: string
): Promise<string> {
  const allRecords = readLog(dataDir);
  const records = getPeriodRecords(allRecords, period);

  // 按动作聚合
  const byEx: Record<string, { best: number; totalSets: number; sessions: number }> = {};
  for (const r of records) {
    if (!byEx[r.exercise]) byEx[r.exercise] = { best: 0, totalSets: 0, sessions: 0 };
    byEx[r.exercise].best = Math.max(byEx[r.exercise].best, r.weight);
    byEx[r.exercise].totalSets += r.sets;
    byEx[r.exercise].sessions += 1;
  }

  const periodLabel = period === "week" ? "本周" : period === "month" ? "本月" : "全部";
  const chartData = JSON.stringify({
    labels: Object.keys(byEx).map((n) => `${n}（kg）`),
    values: Object.values(byEx).map((v) => v.best),
  });

  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>IronStats 训练报告 - ${periodLabel}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; background: #1a1a2e; color: #eee; }
  h1 { color: #e94560; font-size: 28px; margin-bottom: 4px; }
  .subtitle { color: #aaa; font-size: 14px; margin-bottom: 32px; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .card { background: #16213e; border-radius: 12px; padding: 20px; }
  .card h3 { color: #e94560; font-size: 14px; margin: 0 0 8px 0; }
  .card p { font-size: 28px; font-weight: bold; margin: 0; color: #fff; }
  table { width: 100%; border-collapse: collapse; background: #16213e; border-radius: 12px; overflow: hidden; }
  th { background: #0f3460; text-align: left; padding: 12px 16px; color: #e94560; }
  td { padding: 12px 16px; border-bottom: 1px solid #1a1a2e; }
  tr:last-child td { border: none; }
  .badge { display: inline-block; background: #e94560; color: white; border-radius: 6px; padding: 2px 8px; font-size: 12px; }
</style>
</head>
<body>
<h1>🏋️ IronStats 训练报告</h1>
<p class="subtitle">${periodLabel}概览 · 生成于 ${new Date().toLocaleDateString("zh-CN")}</p>

<div class="summary">
  <div class="card"><h3>总训练次数</h3><p>${records.length} 次</p></div>
  <div class="card"><h3>覆盖动作</h3><p>${Object.keys(byEx).length} 个</p></div>
  <div class="card"><h3>累计组数</h3><p>${records.reduce((s, r) => s + r.sets, 0)} 组</p></div>
</div>

<h2 style="color:#e94560">📈 各动作最佳重量（kg）</h2>
<canvas id="chart" style="margin-bottom:32px; max-height:260px"></canvas>

<h2 style="color:#e94560">📋 详细记录</h2>
<table>
  <thead><tr><th>日期</th><th>动作</th><th>重量</th><th>组×次数</th><th>备注</th></tr></thead>
  <tbody>
    ${records
      .slice()
      .reverse()
      .slice(0, 20)
      .map(
        (r) =>
          `<tr><td>${new Date(r.date).toLocaleDateString("zh-CN")}</td><td>${r.exercise}</td><td>${r.weight} kg</td><td>${r.sets}×${r.reps}</td><td>${r.note ?? "—"}</td></tr>`
      )
      .join("\n    ")}
  </tbody>
</table>

<script>
new Chart(document.getElementById("chart"), {
  type: "bar",
  data: { labels: ${JSON.stringify(Object.keys(byEx))}, datasets: [{ label: "最佳重量(kg)", data: ${JSON.stringify(Object.values(byEx).map((v) => v.best))}}, backgroundColor: "#e94560" }] },
  options: { responsive: true, plugins: { legend: { display: false } } }
});
</script>
</body>
</html>`;

  const outDir = path.join(dataDir, "reports");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `report-${period}-${Date.now()}.html`);
  fs.writeFileSync(outFile, html);

  return outFile;
}
