export function Brand() { return <a className="brand" href="/"><span>n</span> NovelHUB</a> }

export function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <div className="auth-copy">
        <Brand />
        <div>
          <p className="eyebrow">NGÔI NHÀ CHO MỌI CÂU CHUYỆN</p>
          <h1>Đọc sâu sắc.<br />Viết tự do.</h1>
          <p>NovelHUB kết nối độc giả và tác giả xoay quanh những câu chuyện giàu cảm xúc.</p>
        </div>
        <small>© 2026 NovelHUB</small>
      </div>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  )
}
