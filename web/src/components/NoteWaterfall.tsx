import { Link } from 'react-router-dom'

export type FeedNote = {
  id: string
  title: string
  coverUrl: string | null
  authorName: string
  authorAvatar?: string | null
  likeCount: number
  status?: number
}

const STATUS: Record<number, string> = {
  0: 'Draft',
  1: 'Pending',
  2: 'Published',
  3: 'Offline',
}

export function NoteWaterfall({ notes, showStatus = false }: { notes: FeedNote[]; showStatus?: boolean }) {
  return (
    <div className="waterfall">
      {notes.map((note) => (
        <Link key={note.id} className="feed-card" to={`/notes/${note.id}`}>
          <span className="feed-cover-wrap">
            {note.coverUrl ? <img src={note.coverUrl} alt="" /> : <span className="feed-cover" />}
          </span>
          <strong>{note.title}</strong>
          <span className="feed-meta">
            <span className="feed-author">
              {note.authorAvatar ? <img src={note.authorAvatar} alt="" /> : <span className="avatar tiny" />}
              {note.authorName}
            </span>
            <span className="feed-like" aria-label={`${note.likeCount} likes`}>
              <Heart />
              {showStatus && note.status != null ? STATUS[note.status] ?? note.status : note.likeCount}
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}

function Heart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}
