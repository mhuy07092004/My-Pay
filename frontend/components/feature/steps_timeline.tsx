import { RevealItem, RevealList } from '../motion/reveal'

type Step = { title: string; body: string }

export function StepsTimeline({ steps }: { steps: Step[] }) {
  return (
    <RevealList as="ol" className="p-2 sm:p-3">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        return (
          <RevealItem key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
            {!last ? (
              <span
                className="absolute left-4 top-9 bottom-1 w-px -translate-x-1/2 bg-white/10"
                aria-hidden
              />
            ) : null}
            <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#09090B] text-sm font-medium tabular-nums text-[#C8E664] ring-1 ring-[#C8E664]/40">
              {index + 1}
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-[#A1A1AA]">{step.body}</p>
            </div>
          </RevealItem>
        )
      })}
    </RevealList>
  )
}
