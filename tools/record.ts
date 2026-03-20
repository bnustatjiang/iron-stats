import path from "path";
import fs from "fs";

interface WorkoutRecord {
  id: string;
  date: string; // ISO string
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  note?: string;
}

interface LogParams {
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  note?: string;
}

function readLog(dataDir: string): WorkoutRecord[] {
  const file = path.join(dataDir, "workouts.json");
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw);
}

function writeLog(dataDir: string, records: WorkoutRecord[]): void {
  const file = path.join(dataDir, "workouts.json");
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
}

export async function recordWorkout(
  dataDir: string,
  params: LogParams
): Promise<{ success: boolean; record: WorkoutRecord; message: string }> {
  const records = readLog(dataDir);
  const record: WorkoutRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    exercise: params.exercise,
    sets: params.sets,
    reps: params.reps,
    weight: params.weight,
    note: params.note,
  };
  records.push(record);
  writeLog(dataDir, records);
  return {
    success: true,
    record,
    message: `✅ 已记录：${params.exercise} ${params.weight}kg × ${params.sets}组×${params.reps}次`,
  };
}
