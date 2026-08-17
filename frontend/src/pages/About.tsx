import { Card, Descriptions, Typography } from 'antd'

const { Title, Paragraph, Text } = Typography

const About = () => {
  return (
    <div>
      <Card>
        <Title level={2}>关于郑州美食GIS系统</Title>
        
        <Paragraph>
          郑州美食GIS系统是一个基于地理信息系统（GIS）的餐饮信息服务平台，旨在为郑州市民和游客提供便捷的美食查询、地图浏览和数据分析功能。
        </Paragraph>

        <Title level={3}>系统功能</Title>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="地图浏览">
            在交互式地图上查看郑州市各区县的美食分布，支持缩放、点击查看详情等功能
          </Descriptions.Item>
          <Descriptions.Item label="美食搜索">
            支持按区域、类型、名称等多维度搜索美食，快速找到心仪的餐厅
          </Descriptions.Item>
          <Descriptions.Item label="统计分析">
            提供郑州各区域美食分布、类型统计、价格区间等数据分析功能
          </Descriptions.Item>
          <Descriptions.Item label="数据覆盖">
            覆盖郑州市12个区县，包括金水区、中原区、二七区、管城回族区、惠济区、上街区、中牟县、巩义市、荥阳市、新密市、新郑市、登封市
          </Descriptions.Item>
        </Descriptions>

        <Title level={3} style={{ marginTop: 24 }}>技术架构</Title>
        <Paragraph>
          <Text strong>前端技术栈：</Text> React + TypeScript + Ant Design + Recharts
        </Paragraph>
        <Paragraph>
          <Text strong>后端技术栈：</Text> Node.js + Express + SQLite
        </Paragraph>
        <Paragraph>
          <Text strong>地图服务：</Text> 高德地图 API
        </Paragraph>

        <Title level={3} style={{ marginTop: 24 }}>数据来源</Title>
        <Paragraph>
          本系统使用的餐饮数据来源于公开的POI数据，包括餐厅名称、地址、经纬度、联系电话、营业时间等信息。
        </Paragraph>

        <Title level={3} style={{ marginTop: 24 }}>使用说明</Title>
        <Paragraph>
          1. <Text strong>地图浏览：</Text> 点击左侧菜单的"地图浏览"，在地图上查看所有美食位置，可以使用筛选功能按区域和类型过滤
        </Paragraph>
        <Paragraph>
          2. <Text strong>美食搜索：</Text> 点击左侧菜单的"美食搜索"，输入关键词或选择筛选条件进行搜索
        </Paragraph>
        <Paragraph>
          3. <Text strong>统计分析：</Text> 点击左侧菜单的"统计分析"，查看各种统计数据和图表
        </Paragraph>

        <Title level={3} style={{ marginTop: 24 }}>联系方式</Title>
        <Paragraph>
          如有任何问题或建议，欢迎联系我们。
        </Paragraph>
        <Descriptions bordered column={1} style={{ marginTop: 16 }}>
          <Descriptions.Item label="联系电话">
            <Text strong style={{ fontSize: 16, color: '#1890ff' }}>18569901071</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default About
