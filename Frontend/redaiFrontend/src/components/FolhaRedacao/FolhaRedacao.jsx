import { useEffect, useMemo, useRef } from 'react'
import useLinhaCount, { CHARS_POR_LINHA, LINE_HEIGHT, calcularLinhasUsadas } from './useLinhaCount'
import './FolhaRedacao.css'

const LINHAS_ALERTA = 5
const CHARS_ALERTA = 160
const TECLAS_PERMITIDAS_NO_LIMITE = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Tab',
])

function FolhaRedacao({
  totalLinhas,
  value = '',
  onChange,
  disabled = false,
  placeholder = '',
  maxLength,
  onLinhaCountChange,
  showFooter = true,
}) {
  const totalLinhasSeguro = Math.max(1, Number(totalLinhas) || 1)
  const limiteCaracteres = Number(maxLength) || totalLinhasSeguro * CHARS_POR_LINHA
  const textareaRef = useRef(null)
  const linhasUtilizadas = Math.min(useLinhaCount(value), totalLinhasSeguro)
  const totalCaracteres = value.length
  const atingiuLimite = linhasUtilizadas >= totalLinhasSeguro
  const estaNasUltimas = !atingiuLimite && linhasUtilizadas >= totalLinhasSeguro - LINHAS_ALERTA
  const atingiuLimiteCaracteres = totalCaracteres >= limiteCaracteres
  const estaNoLimiteCaracteres = !atingiuLimiteCaracteres && totalCaracteres >= limiteCaracteres - CHARS_ALERTA
  const linhas = useMemo(
    () => Array.from({ length: totalLinhasSeguro }, (_, index) => index + 1),
    [totalLinhasSeguro],
  )

  useEffect(() => {
    onLinhaCountChange?.(linhasUtilizadas)
  }, [linhasUtilizadas, onLinhaCountChange])

  const handleKeyDown = (event) => {
    if (disabled || !atingiuLimiteCaracteres) {
      return
    }

    const key = event.key
    const isCtrlShortcut = event.ctrlKey && ['a', 'c', 'v'].includes(key.toLowerCase())
    const isAllowedKey = TECLAS_PERMITIDAS_NO_LIMITE.has(key)
    const isModifiedShortcut = event.metaKey || event.altKey

    if (isAllowedKey || isCtrlShortcut || isModifiedShortcut) {
      return
    }

    event.preventDefault()
  }

  const handleBeforeInput = (event) => {
    if (disabled) {
      return
    }

    const inputType = event.nativeEvent?.inputType || event.inputType

    if (inputType?.startsWith('delete')) {
      return
    }

    const insertedText = ['insertLineBreak', 'insertParagraph'].includes(inputType) ? '\n' : event.data || ''
    const nextText = buildNextText(event.currentTarget, insertedText)

    if (nextText.length > limiteCaracteres) {
      event.preventDefault()
      return
    }

    if (calcularLinhasUsadas(nextText) > totalLinhasSeguro) {
      event.preventDefault()
    }
  }

  const handlePaste = (event) => {
    if (disabled) {
      return
    }

    const pastedText = event.clipboardData.getData('text')
    const nextText = buildNextText(event.currentTarget, pastedText)

    if (nextText.length > limiteCaracteres || calcularLinhasUsadas(nextText) > totalLinhasSeguro) {
      event.preventDefault()
      const allowedText = truncateInsertedText(event.currentTarget, pastedText, limiteCaracteres, totalLinhasSeguro)

      if (allowedText !== event.currentTarget.value) {
        onChange?.(allowedText)
      }
    }
  }

  const handleChange = (event) => {
    const nextText = event.target.value

    if (nextText.length > limiteCaracteres) {
      event.target.value = value
      return
    }

    if (calcularLinhasUsadas(nextText) > totalLinhasSeguro) {
      event.target.value = value
      return
    }

    onChange?.(nextText)
  }

  const contadorClassName = [
    'folhaRedacao__contador',
    estaNasUltimas ? 'folhaRedacao__contador--warning' : '',
    atingiuLimite ? 'folhaRedacao__contador--danger' : '',
  ].filter(Boolean).join(' ')
  const charCounterClassName = [
    'folhaRedacao__charCounter',
    estaNoLimiteCaracteres ? 'folhaRedacao__charCounter--warning' : '',
    atingiuLimiteCaracteres ? 'folhaRedacao__charCounter--danger' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="folhaRedacao">
      <div className="folhaRedacao__paper">
        <div className="folhaRedacao__page" style={{ '--folha-total-height': `${totalLinhasSeguro * LINE_HEIGHT}px` }}>
          <div className="folhaRedacao__rightMargin" aria-hidden="true" />
          <div className="folhaRedacao__leftMargin" aria-hidden="true" />
          <div className="folhaRedacao__linhas" aria-hidden="true">
            {linhas.map((linha) => (
              <div
                className={linha === linhasUtilizadas && value.trim() ? 'folhaRedacao__linha folhaRedacao__linha--active' : 'folhaRedacao__linha'}
                key={linha}
              >
                <span>{linha}</span>
              </div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            aria-label="Texto da redacao"
            className="folhaRedacao__textarea"
            disabled={disabled}
            maxLength={limiteCaracteres}
            onBeforeInput={handleBeforeInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            spellCheck="false"
            value={value}
          />
          {placeholder && !value && <span className="folhaRedacao__placeholder">{placeholder}</span>}
        </div>

        {showFooter && (
          <div className="folhaRedacao__footer">
            <div className="folhaRedacao__counters">
              <span className={contadorClassName}>
                {linhasUtilizadas} / {totalLinhasSeguro} linhas
              </span>
              <span className="folhaRedacao__counterDivider">·</span>
              <span className={charCounterClassName}>
                {formatInteger(totalCaracteres)} / {formatInteger(limiteCaracteres)} caracteres
              </span>
            </div>
            {estaNasUltimas && <span className="folhaRedacao__aviso folhaRedacao__aviso--warning">Voce esta nas ultimas linhas</span>}
            {atingiuLimite && <span className="folhaRedacao__aviso folhaRedacao__aviso--danger">Limite de linhas atingido</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function buildNextText(element, insertedText) {
  const start = element.selectionStart ?? element.value.length
  const end = element.selectionEnd ?? element.value.length

  return `${element.value.slice(0, start)}${insertedText}${element.value.slice(end)}`
}

function truncateInsertedText(element, insertedText, limiteCaracteres, totalLinhas) {
  const start = element.selectionStart ?? element.value.length
  const end = element.selectionEnd ?? element.value.length
  const before = element.value.slice(0, start)
  const after = element.value.slice(end)
  const maxInsertedLength = Math.max(0, limiteCaracteres - before.length - after.length)
  let low = 0
  let high = Math.min(insertedText.length, maxInsertedLength)
  let acceptedText = element.value

  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const candidate = `${before}${insertedText.slice(0, middle)}${after}`

    if (candidate.length <= limiteCaracteres && calcularLinhasUsadas(candidate) <= totalLinhas) {
      acceptedText = candidate
      low = middle + 1
    } else {
      high = middle - 1
    }
  }

  return acceptedText
}

function formatInteger(value) {
  return Number(value || 0).toLocaleString('pt-BR')
}

export default FolhaRedacao
