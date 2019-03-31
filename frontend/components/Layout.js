import Head from 'next/head';

/**
 * Layout component
 */
export default ({ children, title = 'SMS-Burner - Ta emot SMS anonymt' }) => (
  <>
    <Head>
      <title>{ title }</title>
      <meta
        name="viewport"
        content="initial-scale=1.0, width=device-width"
        key="viewport"
      />
    </Head>
    { children }
  </>
);
