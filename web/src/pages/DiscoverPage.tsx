export function DiscoverPage() {
  return (
    <section className="discover">
      <div className="discover-copy">
        <h1>Discover</h1>
        <p>Notes from people you follow will land in this feed.</p>
      </div>
      <div className="empty" role="status">
        <span className="mark large" aria-hidden="true" />
        <h2>No notes yet</h2>
        <p>The feed is empty. Published notes will show up here.</p>
      </div>
    </section>
  )
}
