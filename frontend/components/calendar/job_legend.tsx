import type { SavedRate } from '../../src/lib/rates'

type JobLegendProps = {
  jobs: SavedRate[]
  jobColors: Map<string, string>
  title: string
}

export function JobLegend({ jobs, jobColors, title }: JobLegendProps) {
  if (jobs.length === 0) return null
  return (
    <div>
      <h2 className="sr-only">{title}</h2>
      <ul
        className="flex flex-wrap items-center gap-x-4 gap-y-2"
        aria-labelledby="calendar-legend-title"
      >
        <li
          id="calendar-legend-title"
          className="w-full text-xs font-semibold uppercase tracking-wider text-[#71717A] sm:w-auto sm:shrink-0"
        >
          {title}
        </li>
        {jobs.map((job) => {
          const color = jobColors.get(job.id) ?? '#C8E664'
          return (
            <li key={job.id} className="flex items-center gap-2 text-sm text-[#E4E4E7]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="max-w-[10rem] truncate">{job.name}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
