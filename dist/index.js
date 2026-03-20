"use strict";
const path = require("path");
const fs = require("fs");
const record = require("./tools/record");
const query = require("./tools/query");
const report = require("./tools/report");
const del = require("./tools/delete");

function register(api) {
  try {
    const cfg = (api.config || {}).plugins || {};
    const pluginCfg = (((cfg.entries || {})["iron-stats"] || {}).config || {});
    const dataDir = pluginCfg.dataDir || path.join(process.env.HOME || "", ".iron-stats");

    // 初始化数据目录
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const logFile = path.join(dataDir, "workouts.json");
    if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, JSON.stringify([], null, 2));

    api.logger.info(`[IronStats] 数据目录：${dataDir}`);

    // 工具：记录训练
    api.registerTool({
      name: "iron_stats_log",
      description: "记录一次训练。参数：exercise(动作名), sets(组数), reps(每组次数), weight(重量kg), note(备注选填)",
      parameters: {
        type: "object",
        properties: {
          exercise: { type: "string", description: "动作名称，如：卧推、深蹲、硬拉" },
          sets: { type: "number", description: "组数" },
          reps: { type: "number", description: "每组次数" },
          weight: { type: "number", description: "重量（kg）" },
          note: { type: "string", description: "备注（可选）" },
        },
        required: ["exercise", "sets", "reps", "weight"],
      },
      async execute(_id, params) {
        const result = await record.recordWorkout(dataDir, params);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      },
    });

    // 工具：查询统计
    api.registerTool({
      name: "iron_stats_query",
      description: "查询训练记录和进步统计。可按动作名或时间范围筛选。",
      parameters: {
        type: "object",
        properties: {
          exercise: { type: "string", description: "动作名称（可选）" },
          days: { type: "number", description: "查最近多少天的记录（默认30）" },
        },
      },
      async execute(_id, params) {
        const result = await query.queryStats(dataDir, params);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      },
    });

    // 工具：生成报告
    api.registerTool({
      name: "iron_stats_report",
      description: "生成 HTML 训练报告，可在浏览器中打开查看。",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["week", "month", "all"],
            description: "报告周期：week=本周，month=本月，all=全部",
            default: "month",
          },
        },
      },
      async execute(_id, params) {
        const filePath = await report.generateReport(dataDir, params.period || "month");
        return { content: [{ type: "text", text: `✅ 训练报告已生成：${filePath}` }] };
      },
    });

    // /log 卧推 80kg 8×4
    api.registerCommand({
      name: "log",
      acceptsArgs: true,
      handler: async (ctx) => {
        const parts = (ctx.args || "").trim().split(/\s+/);
        if (parts.length < 3) return { text: "❌ 格式错误，例：/log 卧推 80kg 8×4" };
        const exercise = parts[0];
        const weight = parseFloat(parts[1].replace("kg", "").replace("lb", ""));
        const sr = parts[2].split("×");
        const reps = parseInt(sr[0]);
        const sets = parseInt(sr[1] || "1");
        const note = parts.slice(3).join(" ");
        if (isNaN(weight) || isNaN(reps) || isNaN(sets)) {
          return { text: "❌ 参数解析失败，请检查格式：/log 卧推 80kg 8×4" };
        }
        const result = await record.recordWorkout(dataDir, { exercise, sets, reps, weight, note });
        return { text: `✅ 已记录：${exercise} ${weight}kg × ${sets}组×${reps}次` };
      },
    });

    // /stats [动作名]
    api.registerCommand({
      name: "stats",
      acceptsArgs: true,
      handler: async (ctx) => {
        const exercise = (ctx.args || "").trim();
        const result = await query.queryStats(dataDir, exercise ? { exercise } : { days: 30 });
        return { text: JSON.stringify(result, null, 2) };
      },
    });

    // /report [week|month|all]
    api.registerCommand({
      name: "report",
      acceptsArgs: true,
      handler: async (ctx) => {
        const period = (ctx.args || "month").trim();
        const filePath = await report.generateReport(dataDir, period);
        return { text: `📊 报告已生成：${filePath}` };
      },
    });

    // /del <记录ID>
    api.registerCommand({
      name: "del",
      acceptsArgs: true,
      handler: async (ctx) => {
        const id = (ctx.args || "").trim();
        if (!id) return { text: "❌ 请指定记录ID，例：/del 1742438400000-abc12\n查看所有记录：/records" };
        const result = await del.deleteRecord(dataDir, id);
        return { text: result.message };
      },
    });

    // /records [条数]
    api.registerCommand({
      name: "records",
      acceptsArgs: true,
      handler: async (ctx) => {
        const limit = parseInt((ctx.args || "10").trim()) || 10;
        const records = await del.listRecords(dataDir, limit);
        if (!records.length) return { text: "暂无训练记录，快去 /log 一条吧！" };
        const lines = records.map(r =>
          `[${r.id}] ${new Date(r.date).toLocaleDateString("zh-CN")} · ${r.exercise} ${r.weight}kg × ${r.sets}组×${r.reps}次`
        );
        return { text: "📋 最近记录（复制方括号内ID用于 /del 删除）：\n" + lines.join("\n") };
      },
    });

    api.logger.info("[IronStats] 插件注册完成 ✅");
  } catch (err) {
    try { api.logger.error(`[IronStats] 注册出错: ${err && err.message ? err.message : err}`); } catch (_) {}
    throw err;
  }
}

module.exports = register;
