import React from 'react'
import App, { Container } from 'next/app'
import { Provider } from 'react-redux'
import { Store } from '../store';

/**
 * Override default Next.js App
 */
class MyApp extends App {
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return { pageProps }
  }

  render() {
    const { Component, pageProps } = this.props

    return (
      <Container>
        <Provider store={Store}>
          <Component {...pageProps} />
        </Provider>
      </Container>
    )
  }
}

export default MyApp
