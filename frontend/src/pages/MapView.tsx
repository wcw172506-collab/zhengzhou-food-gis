import { useEffect, useState, useRef } from 'react'
import { Card, Select, Spin, Badge, message } from 'antd'
import axios from 'axios'
import { Restaurant } from '@/types'
import { withCache } from '@/utils/cache'

const AMAP_KEY = 'c7b1ac3bc33a67ef065d85c4531e605e'

const MapView = () => {
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [loadError, setLoadError] = useState<string>('')
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [areas, setAreas] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const infoWindowRef = useRef<any>(null)
  const scriptLoadedRef = useRef(false)
  const massMarksRef = useRef<any>(null)

  // 加载高德地图脚本
  useEffect(() => {
    if (scriptLoadedRef.current) return
    scriptLoadedRef.current = true

    const existingScript = document.querySelector('script[src*="webapi.amap.com"]')
    if (existingScript || window.AMap) {
      initMap()
      return
    }

    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.Scale,AMap.ToolBar,AMap.MarkerClusterer`
    script.async = true
    script.onload = () => {
      setTimeout(() => initMap(), 50)
    }
    script.onerror = () => {
      setLoadError('地图脚本加载失败，请检查网络连接')
    }
    document.head.appendChild(script)

    return () => {
      if (massMarksRef.current) {
        try { massMarksRef.current.setMap(null) } catch(e) {}
      }
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.destroy() } catch(e) {}
        mapInstanceRef.current = null
      }
    }
  }, [])

  // 初始化地图
  const initMap = () => {
    if (!window.AMap) {
      setLoadError('地图API未加载')
      return
    }

    // 等待容器渲染
    const tryInit = (attempts = 0) => {
      if (!mapRef.current) {
        if (attempts < 20) {
          setTimeout(() => tryInit(attempts + 1), 100)
        } else {
          setLoadError('地图容器无法初始化')
        }
        return
      }

      try {
        const map = new window.AMap.Map(mapRef.current, {
          zoom: 11,
          center: [113.6253, 34.7466],
          viewMode: '2D',
          resizeEnable: true
        })

        mapInstanceRef.current = map

        // 动态加载插件
        window.AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
          map.addControl(new window.AMap.Scale())
          map.addControl(new window.AMap.ToolBar({ position: 'RB' }))
        })

        // 创建信息窗口
        infoWindowRef.current = new window.AMap.InfoWindow({
          offset: new window.AMap.Pixel(0, -30),
          closeWhenClickMap: true
        })

        setMapReady(true)
        setLoadError('')
      } catch (err) {
        console.error('地图初始化失败:', err)
        setLoadError('地图初始化失败: ' + (err as Error).message)
      }
    }
    tryInit()
  }

  // 地图就绪后加载数据
  useEffect(() => {
    if (!mapReady) return
    fetchFilters()
    fetchMapRestaurants()
  }, [mapReady])

  // 筛选变化时重新获取数据
  useEffect(() => {
    if (!mapReady) return
    fetchMapRestaurants()
  }, [selectedArea, selectedType])

  const fetchFilters = async () => {
    try {
      const response = await withCache(
        'restaurants-filters',
        () => axios.get('/api/restaurants/filters'),
        10 * 60 * 1000
      )
      setAreas(response.data.areas || [])
      setTypes(response.data.types || [])
    } catch (error) {
      console.error('获取筛选数据失败:', error)
    }
  }

  const fetchMapRestaurants = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (selectedArea !== 'all') params.area = selectedArea
      if (selectedType !== 'all') params.type = selectedType

      const response = await axios.get('/api/restaurants/map', { params })
      const data = response.data.restaurants || []
      setFilteredRestaurants(data)
    } catch (error) {
      console.error('获取餐厅数据失败:', error)
      message.warning('获取餐厅数据失败')
      setFilteredRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  // 更新地图标记 - 使用 MassMarks 海量点渲染（Canvas，支持10万+点）
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // 清除旧的海量点
    if (massMarksRef.current) {
      try { massMarksRef.current.setMap(null) } catch(e) {}
      massMarksRef.current = null
    }

    if (filteredRestaurants.length === 0) return

    // 准备 MassMarks 数据
    const massMarksData = filteredRestaurants.map(restaurant => ({
      lnglat: [restaurant.longitude, restaurant.latitude],
      name: restaurant.name,
      area: restaurant.area || '-',
      typeName: restaurant.typeName || '-',
      address: restaurant.address || '-',
      longitude: restaurant.longitude,
      latitude: restaurant.latitude
    }))

    // 创建 MassMarks 实例
    const massMarks = new window.AMap.MassMarks(massMarksData, {
      opacity: 0.9,
      zIndex: 111,
      cursor: 'pointer',
      zooms: [3, 20],
      style: [{
        url: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
        size: new window.AMap.Size(16, 16),
        anchor: new window.AMap.Pixel(-3, -3)
      }]
    })

    massMarksRef.current = massMarks
    massMarks.setMap(map)

    // 点击事件 - 显示信息窗口
    massMarks.on('click', (e: any) => {
      const restaurant = e.data
      if (!restaurant || !infoWindowRef.current) return

      const lng = restaurant.longitude
      const lat = restaurant.latitude
      const name = encodeURIComponent(restaurant.name || '餐厅')

      const navUrl = (mode: string) =>
        `https://uri.amap.com/navigation?to=${lng},${lat},${name}&mode=${mode}&src=郑州美食GIS&coordinate=gaode&callnative=1`

      const content = `
        <div style="padding:14px;min-width:280px;max-width:360px;">
          <h4 style="margin:0 0 12px;font-size:16px;color:#333;border-bottom:1px solid #f0f0f0;padding-bottom:10px;display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:6px;height:6px;background:#ff4d4f;border-radius:50%;"></span>
            ${restaurant.name}
          </h4>
          <div style="margin-bottom:14px;">
            <p style="margin:8px 0;font-size:13px;color:#555;line-height:1.6;"><strong style="color:#999;font-weight:normal;">区域：</strong>${restaurant.area || '-'}</p>
            <p style="margin:8px 0;font-size:13px;color:#555;line-height:1.6;"><strong style="color:#999;font-weight:normal;">类型：</strong>${restaurant.typeName || '-'}</p>
            <p style="margin:8px 0;font-size:13px;color:#555;line-height:1.6;"><strong style="color:#999;font-weight:normal;">地址：</strong>${restaurant.address || '-'}</p>
          </div>
          <div style="border-top:1px dashed #eee;padding-top:12px;">
            <p style="margin:0 0 10px;font-size:12px;color:#999;">🚗 选择出行方式，新开页面导航到此餐厅</p>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
              <a href="${navUrl('car')}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;background:#1890ff;color:#fff;border-radius:6px;font-size:12px;">
                <span style="font-size:16px;margin-bottom:2px;">🚗</span>
                <span>驾车</span>
              </a>
              <a href="${navUrl('bus')}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;background:#52c41a;color:#fff;border-radius:6px;font-size:12px;">
                <span style="font-size:16px;margin-bottom:2px;">🚌</span>
                <span>公交</span>
              </a>
              <a href="${navUrl('walk')}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;background:#faad14;color:#fff;border-radius:6px;font-size:12px;">
                <span style="font-size:16px;margin-bottom:2px;">🚶</span>
                <span>步行</span>
              </a>
              <a href="${navUrl('ride')}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;background:#eb2f96;color:#fff;border-radius:6px;font-size:12px;">
                <span style="font-size:16px;margin-bottom:2px;">🚴</span>
                <span>骑行</span>
              </a>
            </div>
          </div>
        </div>
      `
      infoWindowRef.current.setContent(content)
      infoWindowRef.current.open(map, [restaurant.longitude, restaurant.latitude])
    })
  }, [filteredRestaurants, mapReady])

  const handleRetry = () => {
    setLoadError('')
    scriptLoadedRef.current = false
    window.location.reload()
  }

  return (
    <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <Card style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#666' }}>区域筛选:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedArea}
              onChange={(value) => setSelectedArea(value)}
              loading={loading}
              options={[
                { value: 'all', label: '全部区域' },
                ...areas.map(area => ({ value: area, label: area }))
              ]}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#666' }}>类型筛选:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedType}
              onChange={(value) => setSelectedType(value)}
              loading={loading}
              options={[
                { value: 'all', label: '全部类型' },
                ...types.map(type => ({ value: type, label: type }))
              ]}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Badge count={filteredRestaurants.length} showZero overflowCount={99999}>
              <span style={{ fontSize: 14, color: '#666', padding: '4px 0' }}>
                {loading ? '加载中...' : '显示餐厅数'}
              </span>
            </Badge>
          </div>
        </div>
      </Card>

      <div style={{ flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {/* 地图容器 - 始终渲染 */}
        <div
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
        />

        {/* 加载覆盖层 */}
        {(loading || !mapReady) && !loadError && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 100
          }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
              {mapReady ? '正在加载餐厅数据...' : '正在加载地图...'}
            </p>
          </div>
        )}

        {/* 错误覆盖层 */}
        {loadError && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 200
          }}>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <h3 style={{ color: '#ff4d4f', marginBottom: 16 }}>加载失败</h3>
              <p style={{ color: '#666', marginBottom: 24 }}>{loadError}</p>
              <button
                onClick={handleRetry}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                重新加载
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapView
