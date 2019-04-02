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
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
        key="viewport"
      />
    </Head>
    { children }
  </>
);
