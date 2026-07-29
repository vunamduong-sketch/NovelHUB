import { Header } from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'

export function HomePage() {
  return (
    <div className="home-layout">
      {/* Main Page Header with Global Navigation Drawer */}
      <Header />

      {/* Body: Currently empty as requested */}
      <main className="home-body">
        {/* Intentionally blank body for future content */}
      </main>

      <Footer />
    </div>
  )
}
