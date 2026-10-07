export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <aside className="bg-ink text-white p-8 lg:p-14 flex flex-col justify-between">
        <div className="flex items-center gap-2 font-display font-extrabold text-xl">
          <span
            className="inline-block w-6 h-6 rounded-full border-4 border-signal"
            aria-hidden="true"
          />
          CivicLens AI
        </div>

        <div className="my-10 lg:my-0">
          <h2 className="font-display font-extrabold text-3xl lg:text-5xl leading-tight max-w-md">
            Report it. We send it to the right department.
          </h2>
          <ul className="mt-6 space-y-3 text-white/80 max-w-md">
            {[
              "Add a photo and your location",
              "AI checks the category and how urgent it is",
              "Follow every step until it is fixed",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span
                  className="mt-2 w-2 h-2 bg-signal shrink-0"
                  aria-hidden="true"
                />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="centerline hidden lg:block" />
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-ink-soft mt-1 mb-6">{subtitle}</p>
          {children}
          <p className="mt-6 text-sm text-ink-soft">{footer}</p>
        </div>
      </main>
    </div>
  );
}