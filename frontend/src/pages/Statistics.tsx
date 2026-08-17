import { useEffect, useState } from 'react'
import { Card, Row, Col, Spin, Statistic, Select } from 'antd'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import { StatisticsData } from '@/types'
import { withCache } from '@/utils/cache'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300']

const Statistics = () => {
  const [data, setData] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedArea, setSelectedArea] = useState<string>('all')

  useEffect(() => {
    fetchStatistics()
  }, [selectedArea])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const cacheKey = `statistics-${selectedArea}`
      
      const response = await withCache(
        cacheKey,
        () => {
          const params: any = {}
          if (selectedArea !== 'all') {
            params.area = selectedArea
          }
          return axios.get('/api/statistics', { params })
        },
        3 * 60 * 1000
      )
      
      setData(response.data)
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!data) {
    return <div>暂无数据</div>
  }

  const areaOptions = [
    { value: 'all', label: '全部区域' },
    ...(data.areaDistribution?.map(area => ({ value: area.name, label: area.name })) || [])
  ]

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Select
          style={{ width: 200 }}
          value={selectedArea}
          onChange={setSelectedArea}
          options={areaOptions}
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="餐饮总数" value={data.totalRestaurants} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="覆盖区域" value={data.totalAreas} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="餐饮类型" value={data.totalTypes} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="区域分布" style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.areaDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.areaDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="类型分布" style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.typeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {data.ratingDistribution && data.ratingDistribution.length > 0 && (
          <Col xs={24} lg={12}>
            <Card title="评分分布" style={{ height: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {data.priceDistribution && data.priceDistribution.length > 0 && (
          <Col xs={24} lg={12}>
            <Card title="价格分布" style={{ height: '100%' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.priceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percent }) => `${range} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.priceDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      )}
      </Row>
    </div>
  )
}

export default Statistics
