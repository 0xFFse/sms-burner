import Document, { 
  Html, 
  Head, 
  Main, 
  NextScript
} from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="sv">
        <Head>
          <meta name="description" content="Telefon-verifikation med bibeh&aring;llen integritet. Ta emot SMS anonymt med tillf&auml;rlligt telefonnummer." />
          <meta property="og:description" content="Telefon-verifikation med bibeh&aring;llen integritet. Ta emot SMS anonymt med tillf&auml;rlligt telefonnummer." />
          <meta property="og:title" content="SMS-burner - Ta emot SMS anonymt" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@smsburner" />
          <meta name="twitter:title" content="SMS-burner - Ta emot SMS anonymt" />
          <meta name="twitter:description" content="Telefon-verifikation med bibeh&aring;llen integritet. Ta emot SMS anonymt med tillf&auml;rlligt telefonnummer." />
          <meta name="twitter:image" content="https://sms.0xff.se/static/dump.png" />
          <meta property="og:image" content="https://sms.0xff.se/static/dump.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument