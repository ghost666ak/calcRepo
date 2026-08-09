import { useMemo, useState } from 'react';
import {
  convertBytes,
  dataRate,
  encodeUnicode,
  inspectBits,
  inspectIeee754,
  fromDate,
  fromUnix,
  type ByteSizeResult,
} from '../../core/tools';
import { useTranslation } from '../../i18n/useTranslation';

type ToolId = 'bits' | 'unicode' | 'ieee754' | 'bytes' | 'timestamp';

export function ToolsView(): JSX.Element {
  const [tool, setTool] = useState<ToolId>('bits');
  const { t } = useTranslation();
  const tools: readonly { id: ToolId; labelKey: string }[] = [
    { id: 'bits', labelKey: 'tools.bitInspector' },
    { id: 'unicode', labelKey: 'tools.unicode' },
    { id: 'ieee754', labelKey: 'tools.ieee754' },
    { id: 'bytes', labelKey: 'tools.bytes' },
    { id: 'timestamp', labelKey: 'tools.timestamp' },
  ];
  return (
    <section className="tools-view" aria-label={t('tools.title')}>
      <header className="tools-view__header">
        <h2>{t('tools.title')}</h2>
        <p>{t('tools.description')}</p>
      </header>
      <nav className="tools-view__tabs" aria-label={t('tools.tabsLabel')}>
        <ul role="tablist">
          {tools.map((entry) => (
            <li key={entry.id} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={tool === entry.id}
                className={`tools-view__tab${tool === entry.id ? ' is-active' : ''}`}
                onClick={() => setTool(entry.id)}
              >
                {t(entry.labelKey)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="tools-view__panel" role="tabpanel" aria-label={t(`tools.${tool === 'bits' ? 'bitInspector' : tool}` as const)}>
        {tool === 'bits' && <BitInspectorTool />}
        {tool === 'unicode' && <UnicodeTool />}
        {tool === 'ieee754' && <Ieee754Tool />}
        {tool === 'bytes' && <BytesTool />}
        {tool === 'timestamp' && <TimestampTool />}
      </div>
    </section>
  );
}

function BitInspectorTool(): JSX.Element {
  const [value, setValue] = useState('0xFF');
  const [width, setWidth] = useState(8);
  const { t } = useTranslation();
  const breakdown = useMemo(() => inspectBits(value, width), [value, width]);
  return (
    <div className="tool" data-testid="tool-bits">
      <h3>{t('tools.bitInspector')}</h3>
      <div className="tool__row">
        <label>
          {t('tools.value')}
          <input type="text" value={value} onChange={(e) => setValue(e.target.value)} data-testid="bits-input" />
        </label>
        <label>
          {t('tools.width')}
          <select value={width} onChange={(e) => setWidth(Number(e.target.value))}>
            {[4, 8, 16, 32, 64].map((w) => <option key={w} value={w}>{t('tools.widthBit', { value: w })}</option>)}
          </select>
        </label>
      </div>
      {breakdown ? (
        <div className="tool__output" data-testid="bits-output">
          <p>Decimal: <strong>{breakdown.source}</strong></p>
          <p>{t('tools.msb')} ──</p>
          <div className="bit-grid">
            {breakdown.groups.map((group, gi) => (
              <span key={gi} className="bit-grid__group">
                {group.map((bit) => (
                  <span key={bit.index} className={`bit bit--${bit.value}`}>{bit.value}</span>
                ))}
              </span>
            ))}
          </div>
          <p>── {t('tools.lsb')}</p>
        </div>
      ) : (
        <p className="tool__error">{t('tools.statusInvalid')}</p>
      )}
    </div>
  );
}

function UnicodeTool(): JSX.Element {
  const [input, setInput] = useState('A');
  const { t } = useTranslation();
  const result = useMemo(() => encodeUnicode(input), [input]);
  return (
    <div className="tool" data-testid="tool-unicode">
      <h3>{t('tools.unicode')}</h3>
      <label>
        {t('tools.inputLabel')} (character, U+XXXX, 0xXXXX, or decimal)
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} data-testid="unicode-input" />
      </label>
      {result.ok ? (
        <div className="tool__output" data-testid="unicode-output">
          <p>Codepoint: U+{result.codepoint.toString(16).toUpperCase().padStart(4, '0')} ({result.codepoint})</p>
          <p>Character: <strong>{String.fromCodePoint(result.codepoint)}</strong></p>
          <p>Name: {result.name}</p>
          <p>UTF-8 bytes: {result.utf8.map((byte) => '0x' + byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')}</p>
          <p>UTF-16 units: {result.utf16.map((unit) => '0x' + unit.toString(16).toUpperCase().padStart(4, '0')).join(' ')}</p>
        </div>
      ) : (
        <p className="tool__error">{t('tools.statusInvalid')}</p>
      )}
    </div>
  );
}

function Ieee754Tool(): JSX.Element {
  const [input, setInput] = useState('0x3F800000');
  const [width, setWidth] = useState<32 | 64>(32);
  const { t } = useTranslation();
  const fields = useMemo(() => inspectIeee754(input, width), [input, width]);
  return (
    <div className="tool" data-testid="tool-ieee754">
      <h3>{t('tools.ieee754')}</h3>
      <div className="tool__row">
        <label>
          {t('tools.value')}
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} data-testid="ieee-input" />
        </label>
        <label>
          {t('tools.width')}
          <select value={width} onChange={(e) => setWidth(Number(e.target.value) as 32 | 64)}>
            <option value={32}>{t('tools.widthBit', { value: 32 })}</option>
            <option value={64}>{t('tools.widthBit', { value: 64 })}</option>
          </select>
        </label>
      </div>
      {fields ? (
        <div className="tool__output" data-testid="ieee-output">
          <p>Hex: <strong>{fields.hex}</strong></p>
          <p>Binary: <code>{fields.binary}</code></p>
          <p>Sign: {fields.sign} · Exponent: {fields.exponent} · Class: {fields.classified}</p>
          <p>Decimal: <strong>{String(fields.decimal)}</strong></p>
        </div>
      ) : (
        <p className="tool__error">{t('tools.statusInvalid')}</p>
      )}
    </div>
  );
}

function BytesTool(): JSX.Element {
  const [bytes, setBytes] = useState('1500');
  const [system, setSystem] = useState<'SI' | 'IEC'>('SI');
  const { t } = useTranslation();
  const result = useMemo<ByteSizeResult | null>(() => convertBytes(Number(bytes), system, 2), [bytes, system]);
  const rate = useMemo(() => dataRate(Number(bytes), 1, system), [bytes, system]);
  return (
    <div className="tool" data-testid="tool-bytes">
      <h3>{t('tools.bytes')}</h3>
      <div className="tool__row">
        <label>
          {t('tools.bytes')}
          <input type="number" min={0} value={bytes} onChange={(e) => setBytes(e.target.value)} data-testid="bytes-input" />
        </label>
        <label>
          {t('tools.unit')}
          <select value={system} onChange={(e) => setSystem(e.target.value as 'SI' | 'IEC')}>
            <option value="SI">SI (1000)</option>
            <option value="IEC">IEC (1024)</option>
          </select>
        </label>
      </div>
      {result ? (
        <div className="tool__output" data-testid="bytes-output">
          <table>
            <thead><tr><th>{t('tools.bytes')}</th><th>{t('tools.value')}</th></tr></thead>
            <tbody>
              {result.entries.map((entry) => (
                <tr key={entry.unit}><td>{entry.unit}</td><td>{entry.bytes}</td></tr>
              ))}
            </tbody>
          </table>
          <p>Rate (over 1 s): {rate ?? '—'}</p>
        </div>
      ) : (
        <p className="tool__error">{t('tools.statusInvalid')}</p>
      )}
    </div>
  );
}

function TimestampTool(): JSX.Element {
  const [input, setInput] = useState('1700000000');
  const [unit, setUnit] = useState<'seconds' | 'millis'>('seconds');
  const { t } = useTranslation();
  const result = useMemo(() => fromUnix(input, unit), [input, unit]);
  const reverse = useMemo(() => fromDate(input), [input]);
  return (
    <div className="tool" data-testid="tool-timestamp">
      <h3>{t('tools.timestamp')}</h3>
      <div className="tool__row">
        <label>
          {t('tools.inputLabel')}
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} data-testid="ts-input" />
        </label>
        <label>
          {t('tools.unit')}
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'seconds' | 'millis')}>
            <option value="seconds">{t('tools.unitSeconds')}</option>
            <option value="millis">{t('tools.unitMillis')}</option>
          </select>
        </label>
      </div>
      {result.ok ? (
        <div className="tool__output" data-testid="ts-output">
          <p>{t('tools.isoUtc', { value: result.iso })}</p>
          <p>{t('tools.utc', { value: result.utc })}</p>
          <p>{t('tools.local', { value: result.local })}</p>
          <p>{t('tools.epochSeconds', { value: result.epochSeconds })}</p>
          <p>{t('tools.epochMillis', { value: result.epochMillis })}</p>
          <p>
            {t('tools.dayOfWeek', { value: t(`tools.days.${result.dayOfWeekIndex}` as const) })}
            {' · '}
            {t('tools.dayNumber', { value: result.dayOfYear })}
            {' · '}
            {t('tools.weekNumber', { value: result.weekOfYear })}
          </p>
        </div>
      ) : (
        <p className="tool__error">{result.error.message}</p>
      )}
      {reverse.ok && <p>{t('tools.parsedIso', { value: reverse.iso })}</p>}
    </div>
  );
}
