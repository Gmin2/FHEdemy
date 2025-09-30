import { useState } from 'react'
import { StorySteps } from '../components/StorySteps'
import { CodeExplorer } from '../components/CodeExplorer'
import { codeMap, CodeKey } from '../mapping'

export default function StepsPage() {
  const [activeCode, setActiveCode] = useState<CodeKey>('connect_wallet')
  const [highlight, setHighlight] = useState<[number, number] | null>(codeMap[activeCode].highlight || null)

  const onHover = (key: CodeKey | null) => {
    if (!key) return
    setActiveCode(key)
    setHighlight(codeMap[key].highlight || null)
  }
  const onSelect = (key: CodeKey) => {
    setActiveCode(key)
    setHighlight(codeMap[key].highlight || null)
  }

  return (
    <section className="stage">
      <div className="canvas">
        <StorySteps onHover={onHover} onSelect={onSelect} />
      </div>
      <div className="dock">
        <CodeExplorer title={codeMap[activeCode].title} language={codeMap[activeCode].language} code={codeMap[activeCode].code} highlight={highlight} />
      </div>
    </section>
  )
}
