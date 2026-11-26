import { useId } from 'react';
import { formatPaise } from '../../domain/money';
import {
  evaluateExactSplitStatus,
  evaluatePercentSplitStatus,
  getEqualSplitPreview,
  type SplitType,
} from '../../domain/validation';
import type { Member } from '../../types/expense';
import { cx } from '../ui/cx';
import styles from './SplitEditor.module.css';

interface SplitEditorProps {
  members: readonly Member[];
  splitType: SplitType;
  onSplitTypeChange: (nextType: SplitType) => void;
  amountPaise: number | null;
  equalMemberIds: readonly string[];
  onToggleEqualMember: (memberId: string) => void;
  exactShares: Readonly<Record<string, string>>;
  onExactShareChange: (memberId: string, value: string) => void;
  percentShares: Readonly<Record<string, string>>;
  onPercentShareChange: (memberId: string, value: string) => void;
  splitError?: string;
  exactMemberErrors: Readonly<Record<string, string>>;
  percentMemberErrors: Readonly<Record<string, string>>;
}

const SPLIT_MODES: ReadonlyArray<{ value: SplitType; label: string }> = [
  { value: 'equal', label: 'Equally' },
  { value: 'exact', label: 'Exact amounts' },
  { value: 'percent', label: 'Percentages' },
];

export function SplitEditor({
  members,
  splitType,
  onSplitTypeChange,
  amountPaise,
  equalMemberIds,
  onToggleEqualMember,
  exactShares,
  onExactShareChange,
  percentShares,
  onPercentShareChange,
  splitError,
  exactMemberErrors,
  percentMemberErrors,
}: SplitEditorProps) {
  const baseId = useId();
  const equalPreview =
    splitType === 'equal' ? getEqualSplitPreview(amountPaise, equalMemberIds, members) : null;
  const exactStatus =
    splitType === 'exact' ? evaluateExactSplitStatus(amountPaise, exactShares, members) : null;
  const percentStatus =
    splitType === 'percent' ? evaluatePercentSplitStatus(percentShares, members) : null;

  return (
    <div className={styles.container}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Split type</legend>
        <div className={styles.modeGrid}>
          {SPLIT_MODES.map((mode) => {
            const radioId = `${baseId}-mode-${mode.value}`;
            return (
              <label key={mode.value} htmlFor={radioId} className={styles.modeOption}>
                <input
                  id={radioId}
                  type="radio"
                  name="splitType"
                  value={mode.value}
                  checked={splitType === mode.value}
                  onChange={() => {
                    onSplitTypeChange(mode.value);
                  }}
                  className={styles.radioInput}
                />
                <span>{mode.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {splitType === 'equal' ? (
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Participants</legend>
          <p className={styles.helperText}>
            Choose who shares this expense. The payer does not need to be included.
          </p>
          <div className={styles.memberRows}>
            {members.map((member) => {
              const checkboxId = `${baseId}-equal-${member.id}`;
              const isChecked = equalMemberIds.includes(member.id);
              const sharePaise = equalPreview?.[member.id];

              return (
                <div key={member.id} className={styles.memberRow}>
                  <div className={styles.checkboxControl}>
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        onToggleEqualMember(member.id);
                      }}
                      className={styles.checkboxInput}
                    />
                    <label htmlFor={checkboxId} className={styles.memberLabel}>
                      {member.name}
                    </label>
                  </div>
                  <span className={styles.sharePreview}>
                    {isChecked && sharePaise !== undefined ? formatPaise(sharePaise) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {splitType === 'exact' && exactStatus ? (
        <fieldset className={styles.fieldset}>
          <div className={styles.fieldsetHeader}>
            <legend className={styles.legend}>Exact amounts (₹)</legend>
            <span
              className={cx(
                styles.statusPill,
                exactStatus.validEntries && amountPaise !== null && exactStatus.remainingPaise === 0
                  ? styles.statusBalanced
                  : styles.statusPending,
              )}
              aria-live="polite"
            >
              {exactStatus.message}
            </span>
          </div>
          <div className={styles.memberRows}>
            {members.map((member) => {
              const inputId = `${baseId}-exact-${member.id}`;
              const errorId = `${inputId}-error`;
              const memberError = exactMemberErrors[member.id];

              return (
                <div key={member.id} className={styles.inputRowGroup}>
                  <div className={styles.inputRow}>
                    <label htmlFor={inputId} className={styles.memberLabel}>
                      {member.name} (₹)
                    </label>
                    <input
                      id={inputId}
                      name={`exact-${member.id}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={exactShares[member.id] ?? ''}
                      aria-invalid={memberError ? true : undefined}
                      aria-describedby={memberError ? errorId : undefined}
                      onChange={(event) => {
                        onExactShareChange(member.id, event.target.value);
                      }}
                      className={cx(styles.numericInput, memberError && styles.inputInvalid)}
                    />
                  </div>
                  {memberError ? (
                    <p id={errorId} role="alert" className={styles.memberError}>
                      {memberError}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {splitType === 'percent' && percentStatus ? (
        <fieldset className={styles.fieldset}>
          <div className={styles.fieldsetHeader}>
            <legend className={styles.legend}>Percentages (%)</legend>
            <span
              className={cx(
                styles.statusPill,
                percentStatus.validEntries && percentStatus.remainingBasisPoints === 0
                  ? styles.statusBalanced
                  : styles.statusPending,
              )}
              aria-live="polite"
            >
              {percentStatus.message}
            </span>
          </div>
          <div className={styles.memberRows}>
            {members.map((member) => {
              const inputId = `${baseId}-percent-${member.id}`;
              const errorId = `${inputId}-error`;
              const memberError = percentMemberErrors[member.id];

              return (
                <div key={member.id} className={styles.inputRowGroup}>
                  <div className={styles.inputRow}>
                    <label htmlFor={inputId} className={styles.memberLabel}>
                      {member.name} (%)
                    </label>
                    <input
                      id={inputId}
                      name={`percent-${member.id}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={percentShares[member.id] ?? ''}
                      aria-invalid={memberError ? true : undefined}
                      aria-describedby={memberError ? errorId : undefined}
                      onChange={(event) => {
                        onPercentShareChange(member.id, event.target.value);
                      }}
                      className={cx(styles.numericInput, memberError && styles.inputInvalid)}
                    />
                  </div>
                  {memberError ? (
                    <p id={errorId} role="alert" className={styles.memberError}>
                      {memberError}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {splitError ? (
        <p role="alert" className={styles.splitError}>
          {splitError}
        </p>
      ) : null}
    </div>
  );
}
