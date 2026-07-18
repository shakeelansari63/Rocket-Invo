import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Spin } from 'antd'
import {
  ShoppingOutlined,
  FileTextOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { DashboardStats, Invoice } from '../types'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getDashboardStats().then((data) => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  if (!stats) return null

  const invoiceColumns = [
    { title: 'Invoice No', dataIndex: 'invoice_no', key: 'invoice_no' },
    {
      title: 'Date', dataIndex: 'date', key: 'date',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Total', dataIndex: 'total', key: 'total',
      render: (v: number) => `₹${v.toFixed(2)}`,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'paid' ? 'green' : s === 'unpaid' ? 'orange' : 'red'}>
          {s.toUpperCase()}
        </Tag>
      ),
    },
  ]

  const lowStockColumns = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    {
      title: 'Stock', dataIndex: 'stock_qty', key: 'stock_qty',
      render: (v: number, r: any) => (
        <span style={{ color: v <= r.min_stock ? '#ff4d4f' : undefined, fontWeight: 600 }}>
          {v} / {r.min_stock}
        </span>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Dashboard</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Products"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined style={{ color: '#4f46e5' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={stats.totalInvoices}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Low Stock Alerts"
              value={stats.lowStockCount}
              valueStyle={{ color: stats.lowStockCount > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Recent Invoices">
            <Table
              dataSource={stats.recentInvoices}
              columns={invoiceColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Low Stock Alerts">
            {stats.lowStockProducts.length > 0 ? (
              <Table
                dataSource={stats.lowStockProducts}
                columns={lowStockColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <p style={{ color: '#52c41a', textAlign: 'center', padding: 24 }}>
                All products are well stocked!
              </p>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
