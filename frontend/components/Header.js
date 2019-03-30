/**
 * Page header component
 */
function Header() {
  return (
    <header>
      <div className={'title'}>
        <img src="/static/fire.png" alt="Burn" />
        <h1 className={'logo'}>SMS Burner</h1>
        <img src="/static/fire.png" alt="Burn" />
      </div>
      <div className={'description'}>
        <h2>Another privacy layer for your phone.</h2>
      </div>
    </header>
  );
}

export default Header;
