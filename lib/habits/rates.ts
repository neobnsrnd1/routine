import type { Habit } from "./types";
type Completion = { habit_id: string; completed_date: string };
const add = (v: string, n: number) => {
  const d = new Date(`${v}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dow = (v: string) => new Date(`${v}T00:00:00Z`).getUTCDay();
function weeks(start: string, end: string) {
  const out: { start: string; end: string }[] = [];
  let s = add(start, -((dow(start) + 6) % 7));
  while (s <= end) {
    out.push({ start: s, end: add(s, 6) });
    s = add(s, 7);
  }
  return out;
}
export function completionRate(
  h: Habit,
  rows: Completion[],
  start: string,
  end: string,
) {
  const done = new Set(
    rows.filter((r) => r.habit_id === h.id).map((r) => r.completed_date),
  );
  if (h.schedule_type === "weekly_target") {
    const target = h.target_per_week ?? 0;
    let n = 0,
      d = 0;
    for (const w of weeks(start, end)) {
      if (w.end < h.start_date) continue;
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const date = add(w.start, i);
        if (
          date >= start &&
          date <= end &&
          date >= h.start_date &&
          done.has(date)
        )
          count++;
      }
      n += Math.min(count, target);
      d += target;
    }
    return { rate: d ? n / d : 0, denominator: d };
  }
  let total = 0,
    completed = 0;
  for (let date = start; date <= end; date = add(date, 1)) {
    if (
      date < h.start_date ||
      (h.schedule_type === "specific_days" &&
        !(h.days_of_week ?? []).includes(dow(date)))
    )
      continue;
    total++;
    if (done.has(date)) completed++;
  }
  return { rate: total ? completed / total : 0, denominator: total };
}
