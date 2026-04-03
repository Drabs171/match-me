import './SkillTag.css';

export default function SkillTag({ skill, type = 'detected' }) {
  return (
    <span className={`skill-tag skill-tag-${type}`}>
      {type === 'missing' && <span className="skill-tag-icon">✕</span>}
      {type === 'detected' && <span className="skill-tag-icon">✓</span>}
      {skill}
    </span>
  );
}
