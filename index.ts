import path from "path";
import fs from "fs";
import type { PluginApi } from "openclaw";
import { recordWorkout } from "./tools/record";
import { queryStats } from "./tools/query";
import { generateReport } from "./tools/report";

export default function register(api: PluginApi) {
  const cfg = api.config?.plugins?.entries?.["iron-stats"]?.config ?? {};
  const dataDir = cfg.dataDir ?? path.join(process.env.HOME!, ".iron-stats");

  // ── 1. 后台服务：初始化数据目录 ──────────────────────────────
  api.registerService({
    id: "iron-stats-init",
    start: () => {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const logFile = path.join(dataDir, "workouts.json");
      if (!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, JSON.stringify([], null, 2));
      }
      api.logger.info(`[IronStats] 数据目录：${dataDir}`);
    },
    stop: () => {},
  });

  // ── 2. Agent Tool：记录训练 ─────────────────────────────────
  api.registerTool({
    name: "iron_stats_log",
    description:
      "记录一次训练。参数：exercise(动作名), sets(组数), reps(每组次数), weight(重量kg), note(备注选填)",
    parameters: {
      exercise: { type: "string", description: "动作名称，如：卧推、深蹲、硬拉" },
      sets: { type: "number", description: "组数" },
      reps: { type: "number", description: "每组次数" },
      weight: { type: "number", description: "重量（kg）" },
      note: { type: "string", description: "备注（可选）", required: false },
    },
    async execute(_id, params) {
      const result = await recordWorkout(dataDir, params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    },
  });

  // ── 3. Agent Tool：查询统计 ──────────────────────────────────
  api.registerTool({
    name: "iron_stats_query",
    description: "查询训练记录和进步统计。可按动作名或时间范围筛选。",
    parameters: {
      exercise: { type: "string", description: "动作名称（可选）", required: false },
      days: { type: "number", description: "查最近多少天的记录（默认30）", required: false },
    },
    async execute(_id, params) {
      const result = await queryStats(dataDir, params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    },
  });

  // ── 4. Agent Tool：生成报告 ──────────────────────────────────
  api.registerTool({
    name: "iron_stats_report",
    description: "生成 HTML 训练报告，可在浏览器中打开查看。",
    parameters: {
      period: {
        type: "string",
        enum: ["week", "month", "all"],
        description: "报告周期：week=本周，month=本月，all=全部",
        default: "month",
      },
    },
    async execute(_id, params) {
      const filePath = await generateReport(dataDir, params.period);
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ 训练报告已生成：${filePath}`,
          },
        ],
      };
    },
  });

  // ── 5. 斜杠命令：快速记录 ───────────────────────────────────
  // /log 卧推 80kg 8×4
  // 格式：/log <动作> <重量> <次数>×<组数> [备注]
  api.registerCommand({
    name: "log",
    acceptsArgs: true,
    handler: async (ctx) => {
      const parts = (ctx.args ?? "").trim().split(/\s+/);
      if (parts.length < 3) {
        return { text: "❌ 格式错误，例：/log 卧推 80kg 8×4" };
      }
      const exercise = parts[0];
      const weightStr = parts[1].replace("kg", "").replace("lb", "");
      const weight = parseFloat(weightStr);
      const setReps = parts[2].split("×");
      const reps = parseInt(setReps[0]);
      const sets = parseInt(setReps[1] ?? "1");
      const note = parts.slice(3).join(" ");

      if (isNaN(weight) || isNaN(reps) || isNaN(sets)) {
        return { text: "❌ 参数解析失败，请检查格式：/log 卧推 80kg 8×4" };
      }

      const result = await recordWorkout(dataDir, { exercise, sets, reps, weight, note });
      return { text: `✅ 已记录：${exercise} ${weight}kg × ${sets}组×${reps}次` };
    },
  });

  // /stats [动作名]
  api.registerCommand({
    name: "stats",
    acceptsArgs: true,
    handler: async (ctx) => {
      const exercise = (ctx.args ?? "").trim();
      const result = await queryStats(dataDir, exercise ? { exercise } : { days: 30 });
      return { text: JSON.stringify(result, null, 2) };
    },
  });

  // /report [week|month|all]
  api.registerCommand({
    name: "report",
    acceptsArgs: true,
    handler: async (ctx) => {
      const period = (ctx.args ?? "month").trim() as "week" | "month" | "all";
      const filePath = await generateReport(dataDir, period);
      return { text: `📊 报告已生成：${filePath}` };
    },
  });

  api.logger.info("[IronStats] 插件注册完成");
}
