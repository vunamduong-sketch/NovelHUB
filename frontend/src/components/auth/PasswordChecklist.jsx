export function PasswordChecklist({ checks, includeMatch = false }) {
  const items = includeMatch ? checks : checks.slice(0, 3)
  return <ul className="password-checklist">{items.map((check) => <li className={check.valid ? 'is-valid' : ''} key={check.label}>{check.valid ? '✓' : '○'} {check.label}</li>)}</ul>
}
