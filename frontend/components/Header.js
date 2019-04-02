import Link from 'next/link'

/**
 * Page header component
 */
function Header() {
  return (
    <header>
      <div className={'title'}>
        <div className={'logo'}>
          <Link href="/">
            <a title={'SMS-Burner'}>
              <img src="/static/logo.png" alt="SMS-Burner" />
            </a>
          </Link>
        </div>
      </div>
      <div className={'description'}>
        <h1>
          Telefon-verifikation med bibeh&aring;llen integritet
        </h1>
      </div>
      <nav className={'navbar'}>
        <ul>
          <li>
            <Link href={'/about'}>
              <a title={'Om'}>
                {'Om'}
              </a>
            </Link>
          </li>
          <li>
            <a
              target="_blank"
              rel="noopener"
              href="https://github.com/0xFFse/sms-burner"
            >
              &Ouml;ppen k&auml;llkod
            </a>
          </li>
          <li>
            <a target="_blank" rel="noopener" href="https://0xff.se">
              0xFF
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
