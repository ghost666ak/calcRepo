import { useCallback, useMemo, useState } from 'react';
import {
  convertBytes,
  dataRate,
  decodeUtf8,
  encodeUnicode,
  fromDate,
  fromUnix,
  inspectBits,
  inspectIeee754,
  utf8Bytes,
  type ByteSizeResult,
} from '../../core/tools';

type ToolId = 'bits' | 'unicode' | 'ieee754' | 'bytes' | 'timestamp';

const TOOLS: readonly { id: ToolId; label: string; description: string }[] = [
  { id: 'bits', label: 'Bit inspector', description: 'Inspect and edit bits across configurable widths.' },
  { id: 'unicode', label: 'Unicode & UTF-8', description: 'Encode/decode characters, code points, and UTF-8 bytes.' },
  { id: 'ieee754', label: 'IEEE-754', description: 'Inspect 32-bit and 64-bit floating-point values.' },
  { id: 'bytes', label: 'Bytes', description: 'Convert byte counts and data rates (SI and IEC).' },
  { id: 'timestamp', label: 'Timestamp', description: 'Convert Unix timestamps and ISO 8601 dates.' },
];

export function ToolsView(): JSX.Element {
  const [tool, setTool] = useState<ToolId>('bits');
  return (
    <section className="tools-view" aria-label="Coding toolbox">
      <header className="tools-view__header">
        <h2>Coding toolbox</h2>
        <p>Standalone utilities for common developer tasks.</p>
      </header>
      <nav className="tools-view__tabs" aria-label="Tool selection">
        <ul role="tablist">
          {TOOLS.map((entry) => (
            <li key={entry.id} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={tool === entry.id}
                className={`tools-view__tab${tool === entry.id ? ' is-active' : ''}`}
                onClick={() => setTool(entry.id)}
              >
                {entry.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="tools-view__panel" role="tabpanel" aria-label={TOOLS.find((entry) => entry.id === tool)?.label}>
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
  const breakdown = useMemo(() => inspectBits(value, width), [value, width]);
  return (
    <div className="tool" data-testid="tool-bits">
      <h3>Bit inspector</h3>
      <div className="tool__row">
        <label>
          Value
          <input type="text" value={value} onChange={(e) => setValue(e.target.value)} data-testid="bits-input" />
        </label>
        <label>
          Width
          <select value={width} onChange={(e) => setWidth(Number(e.target.value))}>
            {[4, 8, 16, 32, 64].map((w) => <option key={w} value={w}>{w}-bit</option>)}
          </select>
        </label>
      </div>
      {breakdown ? (
        <div className="tool__output" data-testid="bits-output">
          <p>Decimal: <strong>{breakdown.source}</strong></p>
          <p>MSB ──</p>
          <div className="bit-grid">
            {breakdown.groups.map((group, gi) => (
              <span key={gi} className="bit-grid__group">
                {group.map((bit) => (
                  <span key={bit.index} className={`bit bit--${bit.value}`}>{bit.value}</span>
                ))}
              </span>
            ))}
          </div>
          <p>── LSB</p>
        </div>
      ) : (
        <p className="tool__error">Unable to parse the value or width.</p>
      )}
    </div>
  );
}

function UnicodeTool(): JSX.Element {
  const [input, setInput] = useState('A');
  const result = useMemo(() => encodeUnicode(input), [input]);
  const decoded = useMemo(() => utf8Bytes(input).join(' '), [input]);
  const handleDecode = useCallback(() => {
    const bytes = input.split(/[\s,]+/).map((token) => Number(token)).filter((n) => Number.isFinite(n));
    if (bytes.length === 0) return null;
    return decodeUtf8(bytes);
  }, [input]);
  const decodedResult = handleDecode();
  return (
    <div className="tool" data-testid="tool-unicode">
      <h3>Unicode &amp; UTF-8</h3>
      <label>
        Input (character, U+XXXX, 0xXXXX, or decimal)
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
        <p className="tool__error">{result.error.message}</p>
      )}
      <p>UTF-8 bytes for current input: {decoded}</p>
      {decodedResult && !decodedResult.ok && (
        <p className="tool__error">{decodedResult.error.message}</p>
      )}
    </div>
  );
}

function Ieee754Tool(): JSX.Element {
  const [input, setInput] = useState('0x3F800000');
  const [width, setWidth] = useState<32 | 64>(32);
  const fields = useMemo(() => inspectIeee754(input, width), [input, width]);
  return (
    <div className="tool" data-testid="tool-ieee754">
      <h3>IEEE-754 inspector</h3>
      <div className="tool__row">
        <label>
          Hex value
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} data-testid="ieee-input" />
        </label>
        <label>
          Width
          <select value={width} onChange={(e) => setWidth(Number(e.target.value) as 32 | 64)}>
            <option value={32}>32-bit</option>
            <option value={64}>64-bit</option>
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
        <p className="tool__error">Unable to parse the value.</p>
      )}
    </div>
  );
}

function BytesTool(): JSX.Element {
  const [bytes, setBytes] = useState('1500');
  const [system, setSystem] = useState<'SI' | 'IEC'>('SI');
  const result = useMemo<ByteSizeResult | null>(() => convertBytes(Number(bytes), system, 2), [bytes, system]);
  const rate = useMemo(() => dataRate(Number(bytes), 1, system), [bytes, system]);
  return (
    <div className="tool" data-testid="tool-bytes">
      <h3>Bytes &amp; data rate</h3>
      <div className="tool__row">
        <label>
          Bytes
          <input type="number" min={0} value={bytes} onChange={(e) => setBytes(e.target.value)} data-testid="bytes-input" />
        </label>
        <label>
          System
          <select value={system} onChange={(e) => setSystem(e.target.value as 'SI' | 'IEC')}>
            <option value="SI">SI (1000)</option>
            <option value="IEC">IEC (1024)</option>
          </select>
        </label>
      </div>
      {result ? (
        <div className="tool__output" data-testid="bytes-output">
          <table>
            <thead><tr><th>Unit</th><th>Value</th></tr></thead>
            <tbody>
              {result.entries.map((entry) => (
                <tr key={entry.unit}><td>{entry.unit}</td><td>{entry.bytes}</td></tr>
              ))}
            </tbody>
          </table>
          <p>Rate (over 1 s): {rate ?? '—'}</p>
        </div>
      ) : (
        <p className="tool__error">Enter a non-negative integer.</p>
      )}
    </div>
  );
}

function TimestampTool(): JSX.Element {
  const [input, setInput] = useState('1700000000');
  const [unit, setUnit] = useState<'seconds' | 'millis'>('seconds');
  const result = useMemo(() => fromUnix(input, unit), [input, unit]);
  const reverse = useMemo(() => fromDate(input), [input]);
  return (
    <div className="tool" data-testid="tool-timestamp">
      <h3>Timestamp converter</h3>
      <div className="tool__row">
        <label>
          Input
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} data-testid="ts-input" />
        </label>
        <label>
          Unit
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'seconds' | 'millis')}>
            <option value="seconds">Seconds</option>
            <option value="millis">Milliseconds</option>
          </select>
        </label>
      </div>
      {result.ok ? (
        <div className="tool__output" data-testid="ts-output">
          <p>ISO (UTC): <strong>{result.iso}</strong></p>
          <p>UTC: {result.utc}</p>
          <p>Local: {result.local}</p>
          <p>Epoch seconds: {result.epochSeconds}</p>
          <p>Epoch millis: {result.epochMillis}</p>
          <p>Day of week: {result.dayOfWeek} · Day #{result.dayOfYear} · Week #{result.weekOfYear}</p>
        </div>
      ) : (
        <p className="tool__error">{result.error.message}</p>
      )}
      {reverse.ok && <p>Parsed ISO: {reverse.iso}</p>}
    </div>
  );
}