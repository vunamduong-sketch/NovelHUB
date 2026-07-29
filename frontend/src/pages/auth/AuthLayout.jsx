export function Brand() { return <a className="brand" href="/"><span>n</span> NovelHUB</a> }

export function AuthLayout({ title, subtitle, children }) {
  return <main className="auth-page"><div className="auth-copy"><Brand /><div><p className="eyebrow">A HOME FOR EVERY STORY</p><h1>Read deeply.<br />Write freely.</h1><p>NovelHUB brings readers and authors together around the stories that matter.</p></div><small>© 2026 NovelHUB</small></div><section className="auth-panel"><div className="auth-card"><h2>{title}</h2><p className="subtitle">{subtitle}</p>{children}</div></section></main>
}
