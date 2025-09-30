import { CodeKey } from '../mapping'

const steps: { key: CodeKey; label: string; desc: string }[] = [
  { key: 'connect_wallet', label: '1) Connect Wallet', desc: 'Initialize provider and request accounts. (Mocked)' },
  { key: 'encrypt_input', label: '2) Encrypt Input', desc: 'Encrypt user input locally using fhevmjs. (Mocked)' },
  { key: 'compute', label: '3) Compute Onchain', desc: 'Call contract with encrypted data. (Mocked)' },
  { key: 'decrypt_output', label: '4) Decrypt Output', desc: 'Decrypt result with view key. (Mocked)' },
  { key: 'contract', label: 'Smart Contract (FHE Counter)', desc: 'How the contract keeps the private counter.' },
]

export function StepGuide({ onHover, onSelect }: { onHover: (key: CodeKey | null) => void; onSelect: (key: CodeKey) => void }) {
  return (
    <div className="steps">
      {steps.map((s) => (
        <div key={s.key} className="step" onMouseEnter={() => onHover(s.key)} onMouseLeave={() => onHover(null)} onClick={() => onSelect(s.key)}>
          <div className="step-title">{s.label}</div>
          <div className="step-desc">{s.desc}</div>
        </div>
      ))}
    </div>
  )
}
