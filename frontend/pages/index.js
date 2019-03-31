import Layout from '../components/Layout'
import Header from '../components/Header'
import MessagesList from '../containers/MessagesList'
import Footer from '../components/Footer'
import ActiveNumbersList from '../containers/ActiveNumbersList'

/**
 * Home -page top level component
 */
const Home = () => (
  <Layout>
    <div className={'container'}>
      <Header />
      <div className={'content-with-sidebar row'}>
        <section className={'content'}>
          <MessagesList />
        </section>
        <aside className={'sidebar'}>
          <div className={'sidebar-inner'}>
            <h3>Aktiva nummer</h3>
            <ActiveNumbersList />
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  </Layout>
);

export default Home;
