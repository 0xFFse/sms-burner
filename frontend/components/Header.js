import Link from 'next/link'

/**
 * Page header component
 */
function Header() {
  return (
    <header>
      <div className={'title'}>
        <img src="/static/fire.png" alt="Burn" />
        <h1 className={'logo'}>
          <Link href="/">SMS Burner</Link>
        </h1>
        <img src="/static/fire.png" alt="Burn" />
      </div>
      <div className={'description'}>
        <h2>Telefon-verifikation med bibeh&aring;llen integritet</h2>
      </div>
    </header>
  );
}

export default Header;
