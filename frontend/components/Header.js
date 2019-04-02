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
        <h1>Telefon-verifikation med bibeh&aring;llen integritet</h1>
      </div>
      <div className={'navbar'}>
        <Link href={'/about'}><a title={'Om'}>{'Om'}</a></Link> | <a target="_blank" rel="noopener" href="https://github.com/0xFFse/sms-burner">&Ouml;ppen k&auml;llkod</a> | <a target="_blank" rel="noopener" href="https://0xff.se">0xFF</a>
      </div>
    </header>
  );
}

export default Header;
