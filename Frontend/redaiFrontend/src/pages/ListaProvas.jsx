import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarProvas } from '../api/candidato'
import Spinner from '../components/Spinner'

function ListaProvas() {
  const [provas, setProvas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function carregarProvas() {
      try {
        const data = await listarProvas()
        if (active) {
          setProvas(data)
        }
      } catch {
        if (active) {
          setError('Nao foi possivel carregar as provas disponiveis.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    carregarProvas()

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="contentBand">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Provas</p>
          <h2>Escolha uma prova para comecar</h2>
        </div>
        <Link className="primaryLinkButton" to="/candidato/redacoes/nova">
          Submeter redacao
        </Link>
      </div>

      {loading && <Spinner label="Carregando provas" />}
      {error && <p className="formError">{error}</p>}

      {!loading && !error && provas.length === 0 && (
        <p className="emptyState">Nenhuma prova disponivel no momento.</p>
      )}

      <div className="provaGrid">
        {provas.map((prova) => (
          <article className="itemCard" key={prova.id}>
            <div>
              <h3>{prova.cargo}</h3>
              <p className="metaLine">
                {prova.banca} · {prova.estado}
              </p>
              {prova.descricao && <p className="muted">{prova.descricao}</p>}
            </div>
            <div className="cardFooter">
              <span className="scorePill">Nota maxima {formatNumber(prova.notaMaxima)}</span>
              <Link className="primaryLinkButton" to={`/candidato/redacoes/nova?idProva=${prova.id}`}>
                Escrever
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function formatNumber(value) {
  return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export default ListaProvas
