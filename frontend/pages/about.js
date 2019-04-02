import Layout from '../components/Layout'
import Header from '../components/Header'
import Footer from '../components/Footer'

/**
 * About -page top level component
 */
const About = () => (
  <Layout>
    <div className={'container'}>
      <Header />
      <section>
        <article className={'content-with-sidebar row'}>
          <p>
              Fler och fler webbtj&auml;nster kr&auml;ver telefonnummer vid kontoregistrering.
              D&aring; ditt telefonnummer &auml;r unikt kan det enkelt anv&auml;ndas f&ouml;r att knyta ihop skuggprofiler och b&auml;ttre kartl&auml;gga ditt internetanv&auml;ndande.<br/>
              &nbsp;<br/>
              SMS burner togs fram som en tj&auml;nst f&ouml;r att anonymt l&aring;ta anv&auml;ndare kunna dela p&aring; telefonnummer vid kontoregistrering och v&auml;rna om den personliga integriteten.<br/>
              &nbsp;<br/>
              Tj&auml;nsten utvecklades av eldsj&auml;lar under ett Hackathon hos <a target="_blank" href="https://0xff.se/">0xFF Cyber tech community</a> i Stockholm en kv&auml;ll i Mars 2019.
          </p>
        </article>
      </section>
      <Footer />
    </div>
  </Layout>
);

export default About;
