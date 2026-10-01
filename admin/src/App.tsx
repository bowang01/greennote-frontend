import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.tsx'
import { AdminLayout } from './layouts/AdminLayout.tsx'
import { DepartmentsPage, DictionariesPage, FilesPage, LogsPage } from './pages/CatalogPages.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { ChannelsPage } from './pages/ChannelsPage.tsx'
import { MembersPage } from './pages/MembersPage.tsx'
import { NotesPage } from './pages/NotesPage.tsx'
import { SitePage } from './pages/SitePage.tsx'
import { TopicsPage } from './pages/TopicsPage.tsx'
import { SiteProvider } from './site/SiteContext.tsx'

function RequireAuth() {
  const { token } = useAuth()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <AdminLayout />
}

export default function App() {
  return (
    <SiteProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route index element={<HomePage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/site" element={<SitePage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/dictionaries" element={<DictionariesPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/logs" element={<LogsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </SiteProvider>
  )
}
