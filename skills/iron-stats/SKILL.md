---
name: iron-stats
description: IronStats 健身训练记录与统计 Plugin。当你需要记录训练、查询进步数据、生成训练报告时使用此技能。
---

# IronStats 使用指南

## 核心命令

### 记录训练
- `/log 卧推 80kg 8×4`
- 自然语言：「今天练了卧推，4组每组8个，80公斤」

### 查看记录
- `/records` — 查看最近10条（含ID）
- `/records 20` — 查看最近20条

### 删除错误记录
- `/records` 查看记录，复制想删除那条的 **[ID]**
- `/del <ID>` 删除对应记录

### 查看统计
- `/stats` — 最近30天所有动作统计
- `/stats 卧推` — 只看卧推进步曲线

### 生成报告
- `/report week` — 本周 HTML 报告
- `/report month` — 本月（默认）
- `/report all` — 全部记录

## 数据存储
- `~/.iron-stats/workouts.json`
- `~/.iron-stats/reports/`

## 单位
默认 kg，可在 config 中改为 lb
