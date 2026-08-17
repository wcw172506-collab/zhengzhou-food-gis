import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Spin } from 'antd'
import MainLayout from '@/components/layout/MainLayout'
import Login from '@/pages/Login'
import { clearCache } from '@/utils/cache'

const MapView = lazy(() => import('@/pages/MapView'))
const Statistics = lazy(() => import('@/pages/Statistics'))
const Search = lazy(() => import('@/pages/Search'))
const About = lazy(() => import('@/pages/About'))
const UserManagement = lazy(() => import('@/pages/UserManagement'))

interface User {
  id: number
  username: string
  email: string
  role: string
}

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

interface AdminRouteProps {
  children: React.ReactNode
  user: User | null
  loading: boolean
}

const AdminRoute = ({ children, user, loading }: AdminRouteProps) => {
  if (loading) {
    return <LoadingFallback />
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== 'admin') {
    return <Navigate to="/map" replace />
  }
  return <>{children}</>
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Failed to parse user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    clearCache()
  }, [])

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/map" replace />} />
        <Route path="/" element={<MainLayout user={user} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/map" replace />} />
          <Route path="map" element={<MapView />} />
          <Route path="search" element={<Search />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="about" element={<About />} />
          <Route path="users" element={
            <AdminRoute user={user} loading={loading}>
              <UserManagement />
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App