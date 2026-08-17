import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Button } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface QuickStat {
  title: string
  value: number
  icon: string
  color: string
}

const Home = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalAreas: 0,
    totalTypes: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/statistics/overview')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const quickStats: QuickStat[] = [
    { title: '餐饮总数', value: stats.totalRestaurants, icon: '🍽️', color: '#1890ff' },
    { title: '覆盖区域', value: stats.totalAreas, icon: '📍', color: '#52c41a' },
    { title: '餐饮类型', value: stats.totalTypes, icon: '🏪', color: '#faad14' },
  ]

  const features = [
    {
      title: '地图浏览',
      description: '在交互式地图上查看所有美食位置，支持缩放、点击查看详情等功能',
      icon: '🗺️',
      action: () => navigate('/map'),
    },
    {
      title: '美食搜索',
      description: '按区域、类型、名称等多维度搜索美食，快速找到心仪的餐厅',
      icon: '🔍',
      action: () => navigate('/search'),
    },
    {
      title: '统计分析',
      description: '查看郑州各区域美食分布、类型统计、价格区间等数据分析',
      icon: '📊',
      action: () => navigate('/statistics'),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>欢迎使用郑州美食GIS系统</h1>
        <p style={{ fontSize: 16, color: '#666' }}>
          探索郑州各区县的美食分布，发现身边的美食餐厅
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {quickStats.map((stat) => (
          <Col xs={24} sm={12} lg={8} key={stat.title}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={<span style={{ fontSize: 24 }}>{stat.icon}</span>}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <h2 style={{ marginBottom: 24 }}>功能导航</h2>
      <Row gutter={[16, 16]}>
        {features.map((feature) => (
          <Col xs={24} md={8} key={feature.title}>
            <Card
              hoverable
              style={{ height: '100%' }}
              bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{feature.icon}</div>
                <h3 style={{ fontSize: 20, marginBottom: 12 }}>{feature.title}</h3>
                <p style={{ color: '#666', marginBottom: 0 }}>{feature.description}</p>
              </div>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={feature.action}
                style={{ marginTop: 16, alignSelf: 'flex-start' }}
              >
                进入功能
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default Home
