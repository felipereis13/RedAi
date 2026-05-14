import { useMemo } from 'react'

const LINE_HEIGHT = 36
const TEXTAREA_FONT = '16px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

let measuringTextarea

function getMeasuringTextarea() {
  if (typeof document === 'undefined') {
    return null
  }

  if (!measuringTextarea) {
    measuringTextarea = document.createElement('textarea')
    measuringTextarea.setAttribute('aria-hidden', 'true')
    Object.assign(measuringTextarea.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      height: '0',
      minHeight: '0',
      overflow: 'hidden',
      border: '0',
      padding: '0',
      resize: 'none',
      boxSizing: 'border-box',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      lineHeight: `${LINE_HEIGHT}px`,
      font: TEXTAREA_FONT,
      letterSpacing: '0',
    })
    document.body.appendChild(measuringTextarea)
  }

  return measuringTextarea
}

export function countLinhas(text, larguraLinha) {
  if (!text || larguraLinha <= 0) {
    return 0
  }

  const measurer = getMeasuringTextarea()

  if (!measurer) {
    return text.split('\n').filter(Boolean).length || 0
  }

  measurer.style.width = `${larguraLinha}px`
  measurer.value = text

  return Math.max(1, Math.ceil(measurer.scrollHeight / LINE_HEIGHT))
}

function useLinhaCount(text, larguraLinha) {
  return useMemo(() => countLinhas(text, larguraLinha), [text, larguraLinha])
}

export { LINE_HEIGHT }
export default useLinhaCount
