import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface HistoryAnswerProps {
  /** The result string. Long strings are truncated; click to expand. */
  readonly value: string;
  /** Character count above which the result is treated as long enough to warrant
   *  a truncated preview. Numbers below this threshold render in full and are
   *  not interactive. */
  readonly truncateThreshold?: number;
}

/** Displays a calculator result in an inline history entry. Long results are
 *  clamped to two lines with an ellipsis and become a clickable button that
 *  toggles the full content — short answers render as static text without a
 *  focus ring so they don't steal keyboard focus from the keypad. */
export function HistoryAnswer({
  value,
  truncateThreshold = 24,
}: HistoryAnswerProps): JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isLong = value.length > truncateThreshold;

  if (!isLong) {
    // Static span — no button styling, no focus capture. Matches the previous
    // look for the common case (short integer / 2-line fraction).
    return <span className="history-answer">{value}</span>;
  }

  return (
    <button
      type="button"
      className={`history-answer ${expanded ? 'history-answer--expanded' : 'history-answer--truncated'}`}
      onClick={() => setExpanded((v) => !v)}
      aria-expanded={expanded}
      aria-label={expanded ? t('history.collapseAnswer') : t('history.expandAnswer')}
      data-testid="history-answer-toggle"
    >
      {value}
    </button>
  );
}
