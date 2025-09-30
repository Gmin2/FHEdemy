import { useMemo, useState } from 'react'
import { CodeKey } from '../mapping'

type Props = { onHover: (key: CodeKey | null) => void; onSelect: (key: CodeKey) => void }

export function Playground({ onHover, onSelect }: Props) {
  const [connected, setConnected] = useState(false)
  const [rating, setRating] = useState('5')
  const [cipher, setCipher] = useState<string>('')
  const [hasVoted, setHasVoted] = useState(false)
  const [surveyResults, setSurveyResults] = useState<{ average: number; count: number } | null>(null)

  const tooltip = useMemo(() => {
    if (!connected) return 'Connect your wallet to participate in the anonymous survey.'
    if (!cipher) return 'Enter your rating (1-10) and encrypt it.'
    if (!hasVoted) return 'Submit your encrypted rating to the survey.'
    if (!surveyResults) return 'Decrypt to view aggregate results (individual responses stay private).'
    return 'Survey completed! All responses remain anonymous.'
  }, [connected, cipher, hasVoted, surveyResults])

  return (
    <div className="playground">
      <div className="card" style={{ paddingTop: 20 }}>
        <div className="toolbar">
          <button
            className={`btn ${connected ? 'secondary' : 'primary'}`}
            onMouseEnter={() => onHover('connect_wallet')}
            onMouseLeave={() => onHover(null)}
            onClick={() => {
              setConnected(true)
              onSelect('connect_wallet')
            }}
          >
{connected ? 'Connected - Ready to Survey' : 'Connect Wallet'}
          </button>
          <div className="spacer" />
          <span className="hint">{tooltip}</span>
        </div>

        <h3 style={{margin:'10px 0 6px'}}>Anonymous Survey</h3>
        <p className="hint">Rate our tutorial quality (1-10). Your response stays private while contributing to public stats.</p>
        <div className="row">
          <label>Your Rating</label>
          <input
            type="number"
            min="1"
            max="10"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            onFocus={() => onHover('encrypt_input')}
          />
          <button
            className="btn"
            onMouseEnter={() => onHover('encrypt_input')}
            onMouseLeave={() => onHover(null)}
            onClick={() => {
              // Mock encryption: prepend ENC(
              setCipher(`ENC(${rating})`)
              onSelect('encrypt_input')
            }}
            disabled={!connected}
          >
            Encrypt Response
          </button>
        </div>

        <div className="row">
          <label>Ciphertext</label>
          <input value={cipher} readOnly placeholder="Encrypted value will appear here" />
        </div>

        <div className="row" style={{marginTop:12}}>
          <button
            className="btn"
            onMouseEnter={() => onHover('compute')}
            onMouseLeave={() => onHover(null)}
            onClick={() => {
              // Mock survey submission
              setHasVoted(true)
              onSelect('compute')
            }}
            disabled={!cipher || hasVoted}
          >
            {hasVoted ? 'Vote Submitted ✓' : 'Submit to Survey'}
          </button>

          <button
            className="btn"
            onMouseEnter={() => onHover('decrypt_output')}
            onMouseLeave={() => onHover(null)}
            onClick={() => {
              // Mock decrypt: reveal aggregated results only
              const mockAverage = 7.3 + (Math.random() * 0.4 - 0.2) // Random around 7.3
              const mockCount = Math.floor(15 + Math.random() * 10) // Random 15-25
              setSurveyResults({
                average: Math.round(mockAverage * 10) / 10,
                count: mockCount
              })
              onSelect('decrypt_output')
            }}
            disabled={!hasVoted}
          >
            View Results
          </button>
        </div>

        <div className="row result">
          <div className="stat">
            <div className="label">Average Rating</div>
            <div className="value">{surveyResults?.average ?? '-'} / 10</div>
          </div>
          <div className="stat">
            <div className="label">Total Responses</div>
            <div className="value">{surveyResults?.count ?? '-'}</div>
          </div>
        </div>
      </div>

      <div className="card info" onMouseEnter={() => onHover('contract')} onMouseLeave={() => onHover(null)}>
        <strong>Anonymous Survey Flow:</strong>
        <ul>
          <li>🔒 Encrypt rating client-side → your response becomes private ciphertext</li>
          <li>📊 Submit to survey contract → homomorphic aggregation without revealing individual votes</li>
          <li>📈 Decrypt aggregate results → view average & count while all responses stay secret</li>
        </ul>
      </div>
    </div>
  )
}
