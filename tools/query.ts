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

interface QueryParams {
  exercise?: string;
  days?: number;
}

function readLog(dataDir: string): WorkoutRecord[] {
  const file = path.join(dataDir, "workouts.json");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function computeStats(records: WorkoutRecord[]) {
  if (records.length === 0) return null;

  const byExercise: Record<string, WorkoutRecord[]> = {};
  for (const r of records) {
    if (!byExercise[r.exercise]) byExercise[r.exercise] = [];
    byExercise[r.exercise].push(r);
  }

  const summary = Object.entries(byExercise).map(([name, recs]) => {
    const best = Math.max(...recs.map((r) => r.weight));
    const totalSets = recs.reduce((s, r) => s + r.sets, 0);
    const totalReps = recs.reduce((s, r) => s + r.sets * r.reps, 0);
    return { exercise: name, bestWeight: best, totalSets, totalReps, sessions: recs.length };
  });

  return summary;
}

export async function queryStats(
  dataDir: string,
  params: QueryParams
): Promise<object> {
  let records: WorkoutRecord[] = readLog(dataDir);

  // 时间过滤
  if (params.days) {
    const cutoff = Date.now() - params.days * 86400000;
    records = records.filter((r) => new Date(r.date).getTime() >= cutoff);
  }

  // 动作过滤
  if (params.exercise) {
    records = records.filter(
      (r) => r.exercise.toLowerCase() === params.exercise!.toLowerCase()
    );
  }

  const stats = computeStats(records);

  return {
    total: records.length,
    stats,
    records: records.slice(-10).reverse(), // 最近10条
  };
}
