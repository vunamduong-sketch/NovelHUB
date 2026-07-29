function FacebookIcon() {
  return (
    <svg className="footer-social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg className="footer-social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="home-footer">
      <div className="footer-container">
        <div className="footer-brand-section">
          <a className="brand footer-brand" href="/">
            <span>n</span> NovelHUB
          </a>
          <p className="footer-slogan">
            Read deeply. Write freely.<br />
            Nền tảng kết nối người đọc và tác giả truyện trực tuyến.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>Khám phá</h4>
            <ul>
              <li><a href="#categories">Thể loại truyện</a></li>
              <li><a href="#rankings">Top truyện nổi bật</a></li>
              <li><a href="#new">Truyện mới ra mắt</a></li>
              <li><a href="#completed">Truyện đã hoàn thành</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Tác giả</h4>
            <ul>
              <li><a href="#write">Đăng sáng tác</a></li>
              <li><a href="#guidelines">Quy định đăng truyện</a></li>
              <li><a href="#creator-studio">Studio sáng tạo</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Hỗ trợ & Điều khoản</h4>
            <ul>
              <li><a href="#faq">Câu hỏi thường gặp</a></li>
              <li><a href="#terms">Điều khoản sử dụng</a></li>
              <li><a href="#privacy">Chính sách bảo mật</a></li>
              <li><a href="#contact">Liên hệ hỗ trợ</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© 2026 NovelHUB. All rights reserved.</p>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Facebook">
              <FacebookIcon />
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Discord">
              <DiscordIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
