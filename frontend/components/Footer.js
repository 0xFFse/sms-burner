import Link from 'next/link'

/**
 * Footer component
 */
function Footer() {
  return (
    <footer>
      <p>
        <Link href={'/about'}><a title={'Om'}>{'Om'}</a></Link> | <a target="_blank" rel="noopener" href="https://github.com/0xFFse/sms-burner">&Ouml;ppen k&auml;llkod</a> | <a target="_blank" rel="noopener" href="https://0xff.se">0xFF</a> | Ikoner fr&aring;n <a target="_blank" rel="noopener" href="https://icons8.com/">Icons8.com</a>
      </p>
    </footer>
  );
}

export default Footer;
