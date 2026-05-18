import { useMemo } from 'react'

export const CHARS_POR_LINHA = 80
export const LINE_HEIGHT = 36

export function calcularLinhasUsadas(text) {
  if (!text || text === '') {
    return 0
  }

  const textoLimpo = text.replace(/\n$/, '')

  if (textoLimpo === '') {
    return 0
  }

  const linhas = textoLimpo.split('\n')
  return linhas.reduce((total, linha) => {
    if (linha.length === 0) {
      return total + 1
    }

    return total + Math.ceil(linha.length / CHARS_POR_LINHA)
  }, 0)
}

function useLinhaCount(text) {
  return useMemo(() => calcularLinhasUsadas(text), [text])
}

export default useLinhaCount
