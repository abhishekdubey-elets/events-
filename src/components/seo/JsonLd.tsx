/**
 * Renders a schema.org document into the page.
 *
 * `<` is escaped so a stray character in copy can never close the script tag
 * early, and the payload ships inside the server-rendered HTML so crawlers
 * that do not execute JavaScript still see it.
 */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
