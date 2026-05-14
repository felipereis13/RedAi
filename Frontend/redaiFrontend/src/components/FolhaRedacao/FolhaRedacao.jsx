import { useEffect, useMemo, useRef, useState } from 'react'
import useLinhaCount, { LINE_HEIGHT, countLinhas } from './useLinhaCount'
import './FolhaRedacao.css'

const LINHAS_ALERTA = 5

function FolhaRedacao({
  totalLinhas,
  value = '',
  onChange,
  disabled = false,
  placeholder = '',
  maxLength,
  onLinhaCountChange,
}) {
  const totalLinhasSeguro = Math.max(1, Number(totalLinhas) || 1)
  const textareaRef = useRef(null)
  const [larguraLinha, setLarguraLinha] = useState(0)
  const linhasUtilizadas = Math.min(useLinhaCount(value, larguraLinha), totalLinhasSeguro)
  const atingiuLimite = linhasUtilizadas >= totalLinhasSeguro
  const estaNasUltimas = !atingiuLimite && linhasUtilizadas >= totalLinhasSeguro - LINHAS_ALERTA
  const editorDisabled = disabled || atingiuLimite
  const linhas = useMemo(
    () => Array.from({ length: totalLinhasSeguro }, (_, index) => index + 1),
    [totalLinhasSeguro],
  )

  useEffect(() => {
    onLinhaCountChange?.(linhasUtilizadas)
  }, [linhasUtilizadas, onLinhaCountChange])

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return undefined
    }

    const updateWidth = () => {
      setLarguraLinha(textarea.clientWidth)
    }

    updateWidth()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }

    const observer = new ResizeObserver(updateWidth)
    observer.observe(textarea)

    return () => observer.disconnect()
  }, [])

  const handleBeforeInput = (event) => {
    if (disabled || larguraLinha <= 0) {
      return
    }

    const inputType = event.nativeEvent?.inputType || event.inputType

    if (inputType?.startsWith('delete')) {
      return
    }

    const insertedText = ['insertLineBreak', 'insertParagraph'].includes(inputType) ? '\n' : event.data || ''
    const nextText = buildNextText(event.currentTarget, insertedText)

    if (maxLength && nextText.length > maxLength) {
      event.preventDefault()
      return
    }

    if (countLinhas(nextText, larguraLinha) > totalLinhasSeguro) {
      event.preventDefault()
    }
  }

  const handlePaste = (event) => {
    if (disabled || larguraLinha <= 0) {
      return
    }

    const pastedText = event.clipboardData.getData('text')
    const nextText = buildNextText(event.currentTarget, pastedText)

    if (maxLength && nextText.length > maxLength) {
      event.preventDefault()
      return
    }

    if (countLinhas(nextText, larguraLinha) > totalLinhasSeguro) {
      event.preventDefault()
    }
  }

  const handleChange = (event) => {
    const nextText = event.target.value

    if (maxLength && nextText.length > maxLength) {
      event.target.value = value
      return
    }

    if (larguraLinha > 0 && countLinhas(nextText, larguraLinha) > totalLinhasSeguro) {
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
            disabled={editorDisabled}
            maxLength={maxLength}
            onBeforeInput={handleBeforeInput}
            onChange={handleChange}
            onPaste={handlePaste}
            spellCheck="false"
            value={value}
          />
          {placeholder && !value && <span className="folhaRedacao__placeholder">{placeholder}</span>}
        </div>

        <div className="folhaRedacao__footer">
          <div className="folhaRedacao__counters">
            <span className={contadorClassName}>
              {linhasUtilizadas} / {totalLinhasSeguro} linhas utilizadas
            </span>
            {maxLength && (
              <span className={value.length > maxLength * 0.9 ? 'folhaRedacao__charCounter folhaRedacao__charCounter--warning' : 'folhaRedacao__charCounter'}>
                {value.length} / {maxLength} caracteres
              </span>
            )}
          </div>
          {estaNasUltimas && <span className="folhaRedacao__aviso folhaRedacao__aviso--warning">Voce esta nas ultimas linhas</span>}
          {atingiuLimite && <span className="folhaRedacao__aviso folhaRedacao__aviso--danger">Limite de linhas atingido</span>}
        </div>
      </div>
    </div>
  )
}

function buildNextText(element, insertedText) {
  const start = element.selectionStart ?? element.value.length
  const end = element.selectionEnd ?? element.value.length

  return `${element.value.slice(0, start)}${insertedText}${element.value.slice(end)}`
}

export default FolhaRedacao
