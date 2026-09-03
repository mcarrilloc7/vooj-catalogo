export default function PageHeading({ eyebrow, title, children }) {
  return (
    <section>
      {eyebrow && <p className="vooj-eyebrow">{eyebrow}</p>}
      <h1 className="mt-3 vooj-wordmark text-3xl sm:text-4xl">{title}</h1>
      {children && (
        <div className="mt-6 max-w-prose text-vooj-ink/70 leading-relaxed">
          {children}
        </div>
      )}
    </section>
  )
}
