import type { DailyRoutineInstance, ISODate, RoutineHabit, RoutineRevision } from '../types';

export function revisionForDate(habit: RoutineHabit, date: ISODate): RoutineRevision | undefined {
  return habit.revisions
    .filter((revision) => revision.effectiveFrom <= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

/** Automatic items fill the shorter resolved column; ties alternate AM, then PM. */
export function materializeRoutine(habits: RoutineHabit[], date: ISODate): DailyRoutineInstance[] {
  const applicable = habits
    .map((habit) => ({ habit, revision: revisionForDate(habit, date) }))
    .filter((entry): entry is { habit: RoutineHabit; revision: RoutineRevision } => !!entry.revision && !entry.revision.archived)
    .sort((a, b) => a.revision.sortOrder - b.revision.sortOrder);
  let am = 0;
  let pm = 0;
  let tieGoesToAm = true;
  return applicable.map(({ habit, revision }) => {
    let period: 'AM' | 'PM';
    if (revision.period !== 'auto') period = revision.period;
    else if (am < pm) period = 'AM';
    else if (pm < am) period = 'PM';
    else {
      period = tieGoesToAm ? 'AM' : 'PM';
      tieGoesToAm = !tieGoesToAm;
    }
    if (period === 'AM') am += 1;
    else pm += 1;
    return {
      id: `routine_${date}_${habit.id}`,
      sourceRoutineId: habit.id,
      label: revision.label,
      period,
      durationMinutes: revision.durationMinutes,
      defaultStartSlot: revision.defaultStartSlot,
      sortOrder: revision.sortOrder,
      done: false,
    };
  });
}
