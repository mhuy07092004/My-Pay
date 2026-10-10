import { useEffect } from 'react'

/** Attach `.is-scrolling` to the element that is scrolling, then remove it 700ms after it stops. */
export function ScrollbarAutohide() {
  useEffect(() => {
    const hideTimers = new WeakMap<Element, number>()

    function handleScroll(event: Event) {
      const scrollingElement =
        event.target instanceof Element ? event.target : document.scrollingElement
      if (!scrollingElement) return

      scrollingElement.classList.add('is-scrolling')
      window.clearTimeout(hideTimers.get(scrollingElement))
      hideTimers.set(
        scrollingElement,
        window.setTimeout(() => scrollingElement.classList.remove('is-scrolling'), 700),
      )
    }

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', handleScroll, { capture: true })
  }, [])

  return null
}

/** Height that leaves the last visible item cut through the middle, so a still list shows there is more. */
export function getPeekListHeight(listElement: HTMLElement, maxHeight: number): number {
  if (listElement.scrollHeight <= maxHeight) return listElement.scrollHeight

  const listTop = listElement.getBoundingClientRect().top - listElement.scrollTop
  let peekHeight = maxHeight

  for (const item of listElement.querySelectorAll<HTMLElement>('[data-peek-item]')) {
    const itemRect = item.getBoundingClientRect()
    const itemMiddle = itemRect.top - listTop + itemRect.height / 2
    if (itemMiddle > maxHeight) break
    peekHeight = itemMiddle
  }

  return peekHeight
}
