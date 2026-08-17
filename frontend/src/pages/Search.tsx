import { useEffect, useState, useCallback } from 'react'
import { Input, Select, Card, List, Tag, Empty, Spin, Row, Col, Pagination, Space } from 'antd'
import { SearchOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'
import axios from 'axios'
import { Restaurant } from '@/types'
import { withCache } from '@/utils/cache'

const { Search } = Input

const SearchPage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [areas, setAreas] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchKeyword])

  useEffect(() => {
    fetchRestaurants()
  }, [debouncedKeyword, selectedArea, selectedType, currentPage])

  const fetchFilters = async () => {
    try {
      const response = await withCache(
        'restaurants-filters',
        () => axios.get('/api/restaurants/filters'),
        10 * 60 * 1000
      )
      setAreas(response.data.areas)
      setTypes(response.data.types)
      setInitialLoading(false)
    } catch (error) {
      console.error('Failed to fetch filters:', error)
      setInitialLoading(false)
    }
  }

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const cacheKey = `restaurants-${debouncedKeyword}-${selectedArea}-${selectedType}-${currentPage}`
      
      const response = await withCache(
        cacheKey,
        () => {
          const params: any = {
            page: currentPage,
            pageSize
          }

          if (selectedArea !== 'all') {
            params.area = selectedArea
          }

          if (selectedType !== 'all') {
            params.type = selectedType
          }

          if (debouncedKeyword) {
            params.keyword = debouncedKeyword
          }

          return axios.get('/api/restaurants', { params })
        },
        2 * 60 * 1000
      )
      
      setRestaurants(response.data.restaurants)
      setTotal(response.data.pagination.total)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((value: string) => {
    setSearchKeyword(value)
    setCurrentPage(1)
  }, [])

  const handleAreaChange = useCallback((value: string) => {
    setSelectedArea(value)
    setCurrentPage(1)
  }, [])

  const handleTypeChange = useCallback((value: string) => {
    setSelectedType(value)
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: 8 }}>关键词搜索:</label>
            <Search
              placeholder="搜索餐厅名称或地址"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchKeyword(e.target.value)}
              value={searchKeyword}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: 8 }}>区域筛选:</label>
            <Select
              style={{ width: '100%' }}
              size="large"
              value={selectedArea}
              onChange={handleAreaChange}
              loading={loading}
              options={[
                { value: 'all', label: '全部区域' },
                ...areas.map(area => ({ value: area, label: area }))
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: 8 }}>类型筛选:</label>
            <Select
              style={{ width: '100%' }}
              size="large"
              value={selectedType}
              onChange={handleTypeChange}
              loading={loading}
              options={[
                { value: 'all', label: '全部类型' },
                ...types.map(type => ({ value: type, label: type }))
              ]}
            />
          </Col>
        </Row>
        <div style={{ marginTop: 16, color: '#666' }}>
          共找到 <strong>{total}</strong> 家餐厅
        </div>
      </Card>

      <Card>
        {loading && restaurants.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : restaurants.length === 0 ? (
          <Empty description="暂无符合条件的餐厅" />
        ) : (
          <>
            <List
              itemLayout="vertical"
              size="large"
              pagination={false}
              dataSource={restaurants}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
                >
                  <List.Item.Meta
                    title={
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</span>
                        <Tag color="blue" style={{ marginLeft: 12 }}>{item.typeName}</Tag>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <div>
                          <EnvironmentOutlined style={{ marginRight: 8 }} />
                          <span>{item.address}</span>
                        </div>
                        <div>
                          <Tag color="green">{item.area}</Tag>
                        </div>
                        {item.phone && (
                          <div>
                            <PhoneOutlined style={{ marginRight: 8 }} />
                            <span>{item.phone}</span>
                          </div>
                        )}
                        {item.businessHours && (
                          <div style={{ color: '#666' }}>
                            营业时间: {item.businessHours}
                          </div>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            {totalPages > 1 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Pagination
                  current={currentPage}
                  total={total}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showTotal={(total) => `共 ${total} 条`}
                  disabled={loading}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

export default SearchPage