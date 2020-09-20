import Layout from '../components/Layout'
import Header from '../components/Header'
import Footer from '../components/Footer'

/**
 * Abuse -page top level component
 */
const Abuse = () => (
    <Layout>
        <div className={'container'}>
            <Header />
            <section>
                <article className={'content-with-sidebar row'}>
                    <p>
                        Om du uppt&auml;cker ett SMS som inneh&aring;ller illegalt eller
                        opassande inneh&aring;ll kan du rapportera detta genom att trycka p&aring;
                        flaggan till h&ouml;ger om meddelandet.<br />
                        &nbsp;<br />
                        Vi kontrollerar meddelandet
                        och vidtar passande &aring;tg&auml;rder s&aring; fort vi kan.
                    </p>
                </article>
            </section>
            <Footer />
        </div>
    </Layout>
);

export default Abuse;
