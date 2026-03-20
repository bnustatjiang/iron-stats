# IronStats 🏋️ — 健身训练记录 Plugin

> 用自然语言记账、追踪进步曲线、生成可视化报告。

## 功能

| 功能 | 命令 | 说明 |
|------|------|------|
| 记录训练 | `/log 卧推 80kg 8×4` | 秒记训练，自动存入本地 |
| 查看统计 | `/stats` 或 `/stats 卧推` | 各动作最佳重量、累计组数 |
| 生成报告 | `/report week` | HTML 报告，含图表，可浏览器打开 |

## 安装

### 本地开发调试
```bash
openclaw plugins install -l ./iron-stats
openclaw gateway restart
```

### 发布后安装
```bash
clawhub install iron-stats
# 或
npm install -g iron-stats
openclaw plugins install iron-stats
```

## 数据存储

- `~/.iron-stats/workouts.json` — 所有训练记录
- `~/.iron-stats/reports/` — 生成的 HTML 报告

## 配置（可选）

在 `openclaw.json` 的 plugins.entries 中添加：

```json
{
  "plugins": {
    "entries": {
      "iron-stats": {
        "enabled": true,
        "config": {
          "dataDir": "~/.iron-stats",
          "units": "kg"
        }
      }
    }
  }
}
```

## Skill vs Plugin

本项目是 **Plugin**（TypeScript 代码），需要真正读写文件、执行统计、生成图表，这些是 Skill（提示词）做不到的。

---

by Milo | BNU Statistics | Powered by OpenClaw
