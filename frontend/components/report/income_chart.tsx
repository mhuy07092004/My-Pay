import { useEffect, useMemo, useRef, useState } from 'react'
import { formatMoney } from '../../src/lib/timesheet'
import type { IncomeSeries } from '../../src/lib/report'

type IncomeChartProps = {
  series: IncomeSeries
  locale: string
  labels: { estimated: string; net: string; empty: string }
}

const HEIGHT = 240
const PAD = { top: 12, right: 16, bottom: 28, left: 52 }
const ESTIMATED_COLOR = '#C8E664'
const NET_COLOR = '#F4F4F5'

function niceCeil(value: number): { max: number; step: number } {
  if (value <= 0) return { max: 3, step: 1 }
  const raw = value / 3
  const pow = 10 ** Math.floor(Math.log10(raw))
  const unit = [1, 2, 2.5, 5, 10].find((u) => u * pow >= raw) ?? 10
  const step = unit * pow
  return { max: step * 3, step }
}

function linePath(values: (number | null)[], x: (i: number) => number, y: (v: number) => number) {
  let d = ''
  let pen = false
  values.forEach((v, i) => {
    if (v === null) {
      pen = false
      return
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `
    pen = true
  })
  return d.trim()
}

export function IncomeChart({ series, locale, labels }: IncomeChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const { points, granularity } = series

  const lastWithData = useMemo(() => {
    for (let i = points.length - 1; i >= 0; i--) if (points[i].estimated !== null) return i
    return null
  }, [points])
  const [hover, setHover] = useState<number | null>(null)
  const active = hover !== null && hover < points.length ? hover : lastWithData

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short' })
  const monthLongFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })

  const innerW = Math.max(width - PAD.left - PAD.right, 1)
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const maxValue = Math.max(0, ...points.flatMap((p) => [p.estimated ?? 0, p.net ?? 0]))
  const { max, step } = niceCeil(maxValue)
  const n = points.length
  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(Math.floor(innerW / (granularity === 'month' ? 44 : 72)), 1)))

  const pointLabel = (i: number) =>
    granularity === 'month'
      ? monthLongFmt.format(points[i].start)
      : `${dayFmt.format(points[i].start)} – ${dayFmt.format(points[i].end)}`

  function handleMove(event: React.PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    setHover(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))))
  }

  const activePoint = active !== null ? points[active] : null

  return (
    <div>
      <div className="mb-3 flex min-h-10 flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="text-sm text-[#A1A1AA]">
          {activePoint && active !== null ? (
            <>
              <p>{pointLabel(active)}</p>
              <p className="mt-0.5 flex flex-wrap gap-x-4 tabular-nums">
                <span style={{ color: ESTIMATED_COLOR }}>
                  {labels.estimated}: $ {formatMoney(activePoint.estimated ?? 0)}
                </span>
                <span className="text-[#F4F4F5]">
                  {labels.net}:{' '}
                  {activePoint.net === null ? '—' : `$ ${formatMoney(activePoint.net)}`}
                </span>
              </p>
            </>
          ) : null}
        </div>
        <ul className="flex gap-4 text-xs text-[#A1A1AA]">
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded" style={{ background: ESTIMATED_COLOR }} />
            {labels.estimated}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded" style={{ background: NET_COLOR }} />
            {labels.net}
          </li>
        </ul>
      </div>

      <div ref={wrapRef} className="relative w-full" style={{ height: HEIGHT }}>
        {width > 0 ? (
          <svg width={width} height={HEIGHT} role="img" aria-label={labels.estimated}>
            {[0, 1, 2, 3].map((k) => (
              <g key={k}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(k * step)}
                  y2={y(k * step)}
                  stroke="#27272A"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y(k * step)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={12}
                  fill="#A1A1AA"
                >
                  {Math.round(k * step).toLocaleString('en-US')}
                </text>
              </g>
            ))}

            {points.map((p, i) =>
              i % labelEvery === 0 ? (
                <text
                  key={i}
                  x={x(i)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#A1A1AA"
                >
                  {granularity === 'month' ? monthFmt.format(p.start) : dayFmt.format(p.start)}
                </text>
              ) : null,
            )}

            <path
              d={linePath(points.map((p) => p.estimated), x, y)}
              fill="none"
              stroke={ESTIMATED_COLOR}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={linePath(points.map((p) => p.net), x, y)}
              fill="none"
              stroke={NET_COLOR}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.7}
            />

            {activePoint && active !== null ? (
              <>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={PAD.top}
                  y2={PAD.top + innerH}
                  stroke="#3F3F46"
                  strokeWidth={1}
                />
                {activePoint.estimated !== null ? (
                  <circle cx={x(active)} cy={y(activePoint.estimated)} r={4} fill={ESTIMATED_COLOR} />
                ) : null}
                {activePoint.net !== null ? (
                  <circle cx={x(active)} cy={y(activePoint.net)} r={4} fill={NET_COLOR} />
                ) : null}
              </>
            ) : null}

            <rect
              x={PAD.left}
              y={PAD.top}
              width={innerW}
              height={innerH}
              fill="transparent"
              onPointerMove={handleMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        ) : null}

        {!series.hasData ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="max-w-xs text-sm text-[#A1A1AA]">{labels.empty}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
