import Link from 'next/link'

/**
 * Page header component
 */
function Header() {
  return (
    <header>
      <div className={'title'}>
        <img src="/static/fire.png" alt="Burn" />
        <div className={'logo'}>
          <Link href="/">
            <a title={'SMS-Burner'}>
              <img alt={'SMS-Burner'} style={{width: '240px'}} src={'/static/logo-typo.svg'} />
            </a>
          </Link>
        </div>
        <img src="/static/fire.png" alt="Burn" />
      </div>
      <div className={'description'}>
        <h1>Telefon-verifikation med bibeh&aring;llen integritet</h1>
      </div>
    </header>
  );
}

export default Header;
