import { Navigate, Route, Routes, useLocation, type Location } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.tsx'
import { LocationOverlays, WebLayout } from './layouts/WebLayout.tsx'
import { DiscoverPage } from './pages/DiscoverPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { MessagesPage } from './pages/MessagesPage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { SearchPage } from './pages/SearchPage.tsx'
import { UserPage } from './pages/UserPage.tsx'
import { SiteProvider } from './site/SiteContext.tsx'

export default function App() {
  const location = useLocation()
  const background = (location.state as { backgroundLocation?: Location } | null)?.backgroundLocation

  return (
    <SiteProvider>
      <AuthProvider>
        <Routes location={background || location}>
          <Route element={<WebLayout />}>
            <Route index element={<DiscoverPage />} />
            <Route path="/notes/:id" element={<DiscoverPage />} />
            <Route path="/notes/:id/edit" element={<DiscoverPage />} />
            <Route path="/users/:id" element={<UserPage />} />
            <Route path="/publish" element={<DiscoverPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/mine" element={<Navigate to="/profile?tab=notes" replace />} />
            <Route path="/likes" element={<Navigate to="/profile?tab=likes" replace />} />
            <Route path="/collects" element={<Navigate to="/profile?tab=collects" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <LocationOverlays />
      </AuthProvider>
    </SiteProvider>
  )
}
