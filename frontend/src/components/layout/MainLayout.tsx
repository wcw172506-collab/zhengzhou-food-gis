import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme, Button, Dropdown, Space } from 'antd'
import {
  EnvironmentOutlined,
  BarChartOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons'

const { Header, Content, Sider } = Layout

interface User {
  id: number
  username: string
  email: string
  role: string
}

interface MainLayoutProps {
  user: User | null
  onLogout: () => void
}

const MainLayout = ({ user, onLogout }: MainLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const menuItems = [
    {
      key: '/map',
      icon: <EnvironmentOutlined />,
      label: '地图浏览',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '美食搜索',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '统计分析',
    },
    {
      key: '/about',
      icon: <InfoCircleOutlined />,
      label: '关于系统',
    },
  ]

  if (user && user.role === 'admin') {
    menuItems.push({
      key: '/users',
      icon: <TeamOutlined />,
      label: '用户管理',
    })
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: onLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          padding: collapsed ? 0 : '0 16px'
        }}>
          {collapsed ? '郑州美食' : '郑州美食GIS系统'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            padding: '0 24px',
            fontSize: 20,
            fontWeight: 'bold',
            lineHeight: '64px'
          }}>
            郑州美食GIS系统
          </div>
          {user && (
            <div style={{ paddingRight: 24 }}>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button type="text" icon={<UserOutlined />}>
                  <Space>
                    {user.username}
                  </Space>
                </Button>
              </Dropdown>
            </div>
          )}
        </Header>
        <Content style={{ margin: '16px', overflow: 'auto' }}>
          <div
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 96px)',
              background: colorBgContainer,
              borderRadius: 8,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
