import { useState } from 'react'
import { Playground } from '../components/Playground'
import { CodeExplorer } from '../components/CodeExplorer'
import { codeMap, CodeKey } from '../mapping'

export default function PlaygroundPage() {
  const [activeCode, setActiveCode] = useState<CodeKey>('connect_wallet')
  const [highlight, setHighlight] = useState<[number, number] | null>(codeMap[activeCode].highlight || null)

  const handleShowCode = (key: CodeKey) => {
    setActiveCode(key)
    setHighlight(codeMap[key].highlight || null)
  }
  const onHover = (key: CodeKey | null) => {
    if (!key) return
    setActiveCode(key)
    setHighlight(codeMap[key].highlight || null)
  }

  return (
    <section className="stage">
      <div className="canvas" id="playground">
        <Playground onHover={onHover} onSelect={handleShowCode} />
      </div>
      <div className="dock">
        <CodeExplorer title={codeMap[activeCode].title} language={codeMap[activeCode].language} code={codeMap[activeCode].code} highlight={highlight} />
      </div>
    </section>
  )
}
