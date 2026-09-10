export function coverage(source, eventTime) {
  const local = eventTime - source.offset;
  return local >= 0 && local < source.duration;
}
export function replaceAngle(moment, target) {
  const start = moment.start + moment.offset - target.offset;
  if (start < -0.00001 || start + moment.duration > target.duration + 0.00001)
    return null;
  return {
    ...moment,
    clipId: target.id,
    start: Math.max(0, start),
    offset: target.offset,
  };
}
export function locateMoment(moments, position) {
  let cursor = 0;
  for (let i = 0; i < moments.length; i++) {
    if (position < cursor + moments[i].duration)
      return {
        index: i,
        sourceTime: moments[i].start + Math.max(0, position - cursor),
      };
    cursor += moments[i].duration;
  }
  return null;
}
export function exchangeEstimate(t1, t2, t3, t4) {
  if (![t1, t2, t3, t4].every(Number.isFinite) || t4 < t1 || t3 < t2)
    throw new Error('Invalid clock exchange');
  const roundTrip = t4 - t1 - (t3 - t2);
  if (roundTrip < -1) throw new Error('Clock discontinuity');
  return {
    offset: (t2 - t1 + (t3 - t4)) / 2,
    roundTrip: Math.max(0, roundTrip),
    error: Math.max(0, roundTrip) / 2,
  };
}
export function validateManualEntries(clips, entries) {
  if (!Array.isArray(entries) || !entries.length || entries.length > 60)
    throw new Error('Choose between 1 and 60 moments.');
  const normalized = entries.map((e) => {
    const clip = clips.find((c) => c.id === e.clipId);
    if (!clip) throw new Error('A chosen camera is not in this session.');
    if (
      !Number.isFinite(e.start) ||
      !Number.isFinite(e.duration) ||
      e.start < 0 ||
      e.duration < 0.2 ||
      e.start + e.duration > clip.duration + 0.001
    )
      throw new Error('A moment is outside its source recording.');
    return {
      clipId: clip.id,
      start: e.start,
      duration: e.duration,
      globalStart: clip.startTime + e.start * 1000,
    };
  });
  const duration = normalized.reduce((s, e) => s + e.duration, 0);
  if (duration > 120.001) throw new Error('Keep this take within 120 seconds.');
  return {
    entries: normalized,
    duration,
    requestedDuration: duration,
    method: 'chosen-moments',
  };
}
