export function Footer() {
  return (
    <footer className="border-t border-border py-10 px-6 md:px-12 lg:px-16">
      <div className="max-w-4xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="text-sm text-muted-foreground">
            © 2026 Fellowship of Living Systems. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Built with open-source tools.{' '}
            <a
              href="https://github.com/Techniq42/fls-ghl-infrastructure"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Fork the code on GitHub.
            </a>
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground font-display tracking-wider">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}
