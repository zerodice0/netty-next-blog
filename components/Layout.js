/**
 * The Layout.js file is the juicy one.
 * It’s going to pull in our Header, populate the <head> HTML tag,
 * contain all content that the site holds, and throw a footer in there as well.
 */
import Head from 'next/head'
import Header from './Header'

export default function Layout({ children, pageTitle, ...props }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{pageTitle}</title>
      </Head>
      <section className="layout">
        <Header />
        <div className="content">{children}</div>
      </section>
      <footer>Built by me!</footer>
    </>
  )
}
