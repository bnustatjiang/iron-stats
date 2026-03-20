---
name: iron-stats
description: IronStats 健身训练记录与统计 Plugin。当你需要记录训练、查询进步数据、生成训练报告时使用此技能。
---

# IronStats 使用指南

## 核心功能

### 记录训练
- 斜杠命令：`/log <动作名> <重量kg> <次数>×<组数> [备注]`
- 示例：`/log 卧推 80kg 8×4`
- 自然语言：「今天练了卧推，4组每组8个，80公斤」

### 查看统计
- 斜杠命令：`/stats [动作名]`
- 不带参数查看最近30天所有动作统计
- 带动作名只看该动作进步曲线

### 生成报告
- 斜杠命令：`/report [week|month|all]`
- 生成可在浏览器打开的 HTML 训练报告，含图表

## 数据存储
- 训练记录：`~/.iron-stats/workouts.json`
- 报告文件：`~/.iron-stats/reports/`

## 单位
默认 kg，可在 config 中改为 lb
