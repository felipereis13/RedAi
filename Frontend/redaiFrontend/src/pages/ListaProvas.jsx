import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { listarProvas } from '../api/candidato'
import Button from '../components/Button'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'

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
        <Button as={Link} to="/candidato/redacoes/nova">
          Submeter redacao
        </Button>
      </div>

      {loading && <SkeletonLoader rows={3} variant="cards" />}
      {error && <p className="formError">{error}</p>}

      {!loading && !error && provas.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma prova disponivel no momento."
          subtitle="Assim que o administrador cadastrar uma prova ativa, ela aparecera aqui."
        />
      )}

      <div className="provaGrid">
        {provas.map((prova) => (
          <Card key={prova.id}>
            <div>
              <h3>{prova.cargo}</h3>
              <p className="metaLine">
                {prova.banca} · {prova.estado}
              </p>
              {prova.descricao && <p className="muted">{prova.descricao}</p>}
            </div>
            <div className="cardFooter">
              <span className="scorePill">
                Nota maxima {formatNumber(prova.notaMaxima)} - {prova.quantidadeLinhas} linhas
              </span>
              <Button as={Link} to={`/candidato/redacoes/nova?idProva=${prova.id}`}>
                Escrever
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

function formatNumber(value) {
  return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export default ListaProvas
