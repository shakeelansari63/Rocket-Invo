import React, { useState } from 'react'
import { Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import Dashboard from './components/Dashboard'
import Inventory from './components/Inventory'
import Customers from './components/Customers'
import Invoices from './components/Invoices'
import Reports from './components/Reports'
import Settings from './components/Settings'

const { Sider, Content, Header } = Layout
const { Text } = Typography

const menuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: 'inventory', icon: <AppstoreOutlined />, label: 'Inventory' },
  { key: 'customers', icon: <TeamOutlined />, label: 'Customers' },
  { key: 'invoices', icon: <FileTextOutlined />, label: 'Invoices' },
  { key: 'reports', icon: <BarChartOutlined />, label: 'Reports' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
]

const App: React.FC = () => {
  const [activeKey, setActiveKey] = useState('dashboard')

  const renderContent = () => {
    switch (activeKey) {
      case 'dashboard': return <Dashboard />
      case 'inventory': return <Inventory />
      case 'customers': return <Customers />
      case 'invoices': return <Invoices />
      case 'reports': return <Reports />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        theme="light"
        style={{
          borderRight: '1px solid #f0f0f0',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Text strong style={{ fontSize: 18, color: '#4f46e5' }}>
            🚀 Rocket Invo
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => setActiveKey(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: 220 }}>
        <Content style={{ margin: 24, minHeight: 280 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
