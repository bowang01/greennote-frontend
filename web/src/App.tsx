import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.tsx'
import { WebLayout } from './layouts/WebLayout.tsx'
import { DiscoverPage } from './pages/DiscoverPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { MessagesPage } from './pages/MessagesPage.tsx'
import { NotePage } from './pages/NotePage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
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
            <Route path="/notes/:id/edit" element={<NotePage />} />
            <Route path="/publish" element={<DiscoverPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/mine" element={<Navigate to="/profile?tab=notes" replace />} />
            <Route path="/likes" element={<Navigate to="/profile?tab=likes" replace />} />
            <Route path="/collects" element={<Navigate to="/profile?tab=collects" replace />} />
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
