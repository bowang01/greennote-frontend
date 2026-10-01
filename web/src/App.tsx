import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.tsx'
import { WebLayout } from './layouts/WebLayout.tsx'
import { DiscoverPage } from './pages/DiscoverPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { NoteListPage } from './pages/NoteListPage.tsx'
import { NotePage } from './pages/NotePage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { PublishPage } from './pages/PublishPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { SiteProvider } from './site/SiteContext.tsx'

export default function App() {
  return (
    <SiteProvider>
      <AuthProvider>
        <Routes>
          <Route element={<WebLayout />}>
            <Route index element={<DiscoverPage />} />
            <Route path="/notes/:id" element={<NotePage />} />
            <Route path="/publish" element={<PublishPage />} />
            <Route path="/mine" element={<NoteListPage title="My notes" path="/api/member/notes/mine" />} />
            <Route path="/likes" element={<NoteListPage title="Likes" path="/api/member/notes/likes" />} />
            <Route path="/collects" element={<NoteListPage title="Collects" path="/api/member/notes/collects" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </SiteProvider>
  )
}
