import Head from 'next/head';
import Header from '../components/Header';
import MessagesList from '../containers/MessagesList';
import Footer from '../components/Footer';
import ActiveNumbersList from '../containers/ActiveNumbersList';
import "../styles.scss"

/**
 * Home -page top level component
 */
function Home() {
  return (
    <div className={'page-wrapper'}>
      <Head>
        <title>SMS-Burner - Another privacy layer for your phone.</title>
        <meta
          name="viewport"
          content="initial-scale=1.0, width=device-width"
          key="viewport"
        />
      </Head>
      <div className={'container'}>
        <Header />
        <div className={'content-with-sidebar row'}>
          <section className={'content'}>
            <MessagesList />
          </section>
          <aside className={'sidebar'}>
            <div className={'sidebar-inner'}>
              <h3>Active numbers</h3>
              <ActiveNumbersList />
            </div>
          </aside>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Home;
