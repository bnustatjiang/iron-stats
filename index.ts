"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const record_1 = require("./tools/record");
const query_1 = require("./tools/query");
const report_1 = require("./tools/report");
const delete_1 = require("./tools/delete");
function register(api) {
    try {
        const cfg = api.config?.plugins?.entries?.["iron-stats"]?.config ?? {};
        const dataDir = cfg.dataDir ?? path_1.join(process.env.HOME || "", ".iron-stats");
        // ── 1. 后台服务：初始化数据目录 ──────────────────────────────
        api.registerService({
            id: "iron-stats-init",
            start: () => {
                if (!fs_1.existsSync(dataDir)) {
                    fs_1.mkdirSync(dataDir, { recursive: true });
                }
                const logFile = path_1.join(dataDir, "workouts.json");
                if (!fs_1.existsSync(logFile)) {
                    fs_1.writeFileSync(logFile, JSON.stringify([], null, 2));
                }
                api.logger.info(`[IronStats] 数据目录：${dataDir}`);
            },
            stop: () => { },
        });
        // ── 2. Agent Tool：记录训练 ─────────────────────────────────
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
                const result = await record_1.recordWorkout(dataDir, params);
                return { content: [{ type: "text", text: JSON.stringify(result) }] };
            },
        });
        // ── 3. Agent Tool：查询统计 ──────────────────────────────────
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
                const result = await query_1.queryStats(dataDir, params);
                return { content: [{ type: "text", text: JSON.stringify(result) }] };
            },
        });
        // ── 4. Agent Tool：生成报告 ──────────────────────────────────
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
                const filePath = await report_1.generateReport(dataDir, params.period || "month");
                return { content: [{ type: "text", text: `✅ 训练报告已生成：${filePath}` }] };
            },
        });
        // ── 5. 斜杠命令：快速记录 ───────────────────────────────────
        // /log 卧推 80kg 8×4
        api.registerCommand({
            name: "log",
            acceptsArgs: true,
            handler: async (ctx) => {
                const parts = (ctx.args ?? "").trim().split(/\s+/);
                if (parts.length < 3) {
                    return { text: "❌ 格式错误，例：/log 卧推 80kg 8×4" };
                }
                const exercise = parts[0];
                const weight = parseFloat(parts[1].replace("kg", "").replace("lb", ""));
                const setReps = parts[2].split("×");
                const reps = parseInt(setReps[0]);
                const sets = parseInt(setReps[1] || "1");
                const note = parts.slice(3).join(" ");
                if (isNaN(weight) || isNaN(reps) || isNaN(sets)) {
                    return { text: "❌ 参数解析失败，请检查格式：/log 卧推 80kg 8×4" };
                }
                const result = await record_1.recordWorkout(dataDir, { exercise, sets, reps, weight, note });
                return { text: `✅ 已记录：${exercise} ${weight}kg × ${sets}组×${reps}次` };
            },
        });
        // /stats [动作名]
        api.registerCommand({
            name: "stats",
            acceptsArgs: true,
            handler: async (ctx) => {
                const exercise = (ctx.args ?? "").trim();
                const result = await query_1.queryStats(dataDir, exercise ? { exercise } : { days: 30 });
                return { text: JSON.stringify(result, null, 2) };
            },
        });
        // /report [week|month|all]
        api.registerCommand({
            name: "report",
            acceptsArgs: true,
            handler: async (ctx) => {
                const period = (ctx.args ?? "month").trim();
                const filePath = await report_1.generateReport(dataDir, period);
                return { text: `📊 报告已生成：${filePath}` };
            },
        });
        // /del <记录ID> — 删除指定ID的记录
        api.registerCommand({
            name: "del",
            acceptsArgs: true,
            handler: async (ctx) => {
                const id = (ctx.args ?? "").trim();
                if (!id) {
                    return { text: "❌ 请指定要删除的记录ID，例：/del 1742438400000-abc12\n查看所有记录ID：/records" };
                }
                const result = await delete_1.deleteRecord(dataDir, id);
                return { text: result.message };
            },
        });
        // /records — 列出最近N条记录（含ID，供删除用）
        api.registerCommand({
            name: "records",
            acceptsArgs: true,
            handler: async (ctx) => {
                const limit = parseInt((ctx.args ?? "10").trim()) || 10;
                const records = await delete_1.listRecords(dataDir, limit);
                if (records.length === 0) {
                    return { text: "暂无训练记录，快去 /log 一条吧！" };
                }
                const lines = records.map((r) => {
                    const d = new Date(r.date).toLocaleDateString("zh-CN");
                    return `[${r.id}] ${d} · ${r.exercise} ${r.weight}kg × ${r.sets}组×${r.reps}次`;
                });
                return { text: "📋 最近记录（复制方括号内的ID用于 /del 删除）：\n" + lines.join("\n") };
            },
        });
        api.logger.info("[IronStats] 插件注册完成 ✅");
    }
    catch (err) {
        try {
            api.logger.error(`[IronStats] 注册出错: ${err?.message ?? err}`);
        }
        catch (_a) {
            console.error("[IronStats] 注册出错（logger不可用）:", err);
        }
        throw err;
    }
}
module.exports = register;
