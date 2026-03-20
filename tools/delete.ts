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

export async function deleteRecord(
  dataDir: string,
  recordId: string
): Promise<{ success: boolean; message: string }> {
  const file = path.join(dataDir, "workouts.json");
  const raw = fs.readFileSync(file, "utf-8");
  const records: WorkoutRecord[] = JSON.parse(raw);

  const idx = records.findIndex((r) => r.id === recordId);
  if (idx === -1) {
    return { success: false, message: "❌ 未找到该记录，请检查 ID 是否正确" };
  }

  const removed = records.splice(idx, 1)[0];
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
  return {
    success: true,
    message: `✅ 已删除：${removed.exercise} ${removed.weight}kg × ${removed.sets}组×${removed.reps}次（${new Date(removed.date).toLocaleDateString("zh-CN")}）`,
  };
}

export async function listRecords(
  dataDir: string,
  limit = 20
): Promise<WorkoutRecord[]> {
  const file = path.join(dataDir, "workouts.json");
  const raw = fs.readFileSync(file, "utf-8");
  const records: WorkoutRecord[] = JSON.parse(raw);
  return records.slice(-limit).reverse();
}
