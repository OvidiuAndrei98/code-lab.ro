const unit = (value: number) => Math.max(0, Math.min(1, value));

/** Real heading centers crossing one viewport focus line. */
export function serviceProgress(scroll: number, marks: readonly number[]) {
  const segment = scroll < marks[1] ? 0 : 1;
  const local = unit(
    (scroll - marks[segment]) /
      Math.max(1, marks[segment + 1] - marks[segment]),
  );
  const progress = (segment + local) / 2;
  // Select on arrival, keeping the incoming label quiet during the transfer.
  const active = scroll >= marks[2] ? 2 : scroll >= marks[1] ? 1 : 0;
  return { progress, position: progress * 8, segment, local, active };
}
