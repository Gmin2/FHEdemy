import { useState } from 'react'
import { StorySteps } from '../components/StorySteps'
import { CodeExplorer } from '../components/CodeExplorer'
import { codeMap, CodeKey } from '../mapping'

export default function StepsPage() {
  const [activeCode, setActiveCode] = useState<CodeKey>('contract')
  const [highlight, setHighlight] = useState<[number, number] | null>(null)

  const onHover = (key: CodeKey | null, customHighlight?: [number, number] | null) => {
    if (!key) return
    setActiveCode(key)
    setHighlight(customHighlight !== undefined ? customHighlight : (codeMap[key]?.highlight || null))
  }
  const onSelect = (key: CodeKey, customHighlight?: [number, number] | null) => {
    setActiveCode(key)
    setHighlight(customHighlight !== undefined ? customHighlight : (codeMap[key]?.highlight || null))
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
