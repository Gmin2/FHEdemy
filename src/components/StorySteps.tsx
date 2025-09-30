import { useMemo, useState, useEffect } from 'react'
import { codeMap, CodeKey, getStorySteps, initializeContent } from '../mapping'
import { StoryStep } from '../utils/contentLoader'

type Props = { onHover: (key: CodeKey | null) => void; onSelect: (key: CodeKey) => void }

export function StorySteps({ onHover, onSelect }: Props) {
  const [idx, setIdx] = useState(0)
  const [story, setStory] = useState<StoryStep[]>([])
  const [contentLoaded, setContentLoaded] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
  
  useEffect(() => {
    initializeContent().then(() => {
      setStory(getStorySteps())
      setContentLoaded(true)
    })
  }, [])
  
  const step = story[idx] || { key: 'connect_wallet' as CodeKey, title: 'Loading...', copy: 'Loading tutorial content...' }
  const progress = useMemo(() => story.length > 0 ? ((idx + 1) / story.length) * 100 : 0, [idx, story.length])
  
  const toggleSection = (sectionIndex: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionIndex)) {
      newExpanded.delete(sectionIndex)
    } else {
      newExpanded.add(sectionIndex)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="story">
      <div className="story-rail">
        {story.map((section, i) => (
          <div key={section.key} className="section-group">
            <button 
              className={`pill section-header ${i === idx ? 'active' : ''}`} 
              onMouseEnter={() => onHover(section.key as CodeKey)} 
              onMouseLeave={() => onHover(null)} 
              onClick={() => { 
                setIdx(i); 
                onSelect(section.key as CodeKey);
                toggleSection(i);
              }}
            >
              <span className="num">{i + 1}</span>
              {section.title}
              <span className={`expand-icon ${expandedSections.has(i) ? 'expanded' : ''}`}>▼</span>
            </button>
            
            {expandedSections.has(i) && section.subsections && (
              <div className="subsections">
                {section.subsections.map((sub: StoryStep, j: number) => (
                  <button
                    key={sub.key}
                    className="pill subsection"
                    onMouseEnter={() => onHover(sub.key as CodeKey)}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => onSelect(sub.key as CodeKey)}
                  >
                    <span className="sub-num">{i + 1}.{j + 1}</span>
                    {sub.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="story-pane">
        <div className="story-header">
          <div className="story-title">{step.title}</div>
          <div className="story-progress"><div className="bar" style={{ width: `${progress}%` }} /></div>
        </div>
        <p className="story-copy">{step.copy}</p>

        <div className="story-code">
          <div className="mini-title">Illustrative Code</div>
          <pre className="mini-code" onMouseEnter={() => onHover(step.key as CodeKey)} onMouseLeave={() => onHover(null)}>
{codeMap[step.key as CodeKey].code}
          </pre>
        </div>

        <div className="story-actions">
          <button className="btn" disabled={idx === 0 || !contentLoaded} onClick={() => { const i = Math.max(0, idx - 1); setIdx(i); onSelect(story[i].key as CodeKey) }}>Prev</button>
          <button className="btn primary" disabled={idx === story.length - 1 || !contentLoaded} onClick={() => { const i = Math.min(story.length - 1, idx + 1); setIdx(i); onSelect(story[i].key as CodeKey) }}>Next</button>
        </div>
      </div>
    </div>
  )
}
