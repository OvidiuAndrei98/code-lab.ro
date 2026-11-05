"use client";

import { Select } from "@base-ui/react/select";
import styles from "./budget-select.module.css";

const budgetOptions = [
  "Îl stabilim împreună",
  "Sub 2.000 €",
  "2.000 – 5.000 €",
  "5.000 – 10.000 €",
  "Peste 10.000 €",
] as const;

type BudgetSelectProps = {
  id: string;
  name: string;
  disabled?: boolean;
  onValueChange?: () => void;
};

/** Optional budget field; Base UI owns keyboard navigation and form value. */
export function BudgetSelect({
  id,
  name,
  disabled = false,
  onValueChange,
}: BudgetSelectProps) {
  return (
    <Select.Root
      name={name}
      defaultValue={budgetOptions[0]}
      items={budgetOptions.map((value) => ({ label: value, value }))}
      disabled={disabled}
      modal={false}
      onValueChange={onValueChange}
    >
      <Select.Trigger id={id} className={`brief-control ${styles.trigger}`}>
        <Select.Value />
        <Select.Icon className={styles.chevron}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className={styles.positioner}
          alignItemWithTrigger={false}
          align="start"
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          collisionAvoidance={{ side: "flip", align: "shift" }}
          positionMethod="fixed"
        >
          <Select.Popup className={styles.popup}>
            <Select.List className={styles.list} data-lenis-prevent>
              {budgetOptions.map((value) => (
                <Select.Item key={value} value={value} className={styles.item}>
                  <Select.ItemText>{value}</Select.ItemText>
                  <Select.ItemIndicator className={styles.selection}>
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="m4.5 10 3.5 3.5 7.5-7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
