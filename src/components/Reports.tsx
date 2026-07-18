import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Spin, Table } from 'antd'
import {
  FileTextOutlined, DollarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ShoppingOutlined, StockOutlined, WalletOutlined,
} from '@ant-design/icons'
import { ReportData } from '../types'

const Reports: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getReport().then((report) => {
      setData(report)
      setLoading(false)
    })
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  if (!data) return null

  const recentColumns = [
    { title: 'Invoice No', dataIndex: 'invoice_no', key: 'invoice_no' },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${v.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => s.toUpperCase() },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Reports</h2>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Sales Summary">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Invoices"
                  value={data.salesSummary.totalInvoices}
                  prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Sales"
                  value={data.salesSummary.totalSales}
                  prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                  precision={2}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Paid"
                  value={data.salesSummary.totalPaid}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Unpaid"
                  value={data.salesSummary.totalUnpaid}
                  prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                  precision={2}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Inventory Summary">
            <Row gutter={[16, 16]}>
              <Col xs={8}>
                <Statistic
                  title="Total Products"
                  value={data.inventorySummary.totalProducts}
                  prefix={<ShoppingOutlined style={{ color: '#4f46e5' }} />}
                />
              </Col>
              <Col xs={8}>
                <Statistic
                  title="Total Stock Units"
                  value={data.inventorySummary.totalStockUnits}
                  prefix={<StockOutlined style={{ color: '#1890ff' }} />}
                />
              </Col>
              <Col xs={8}>
                <Statistic
                  title="Inventory Value"
                  value={data.inventorySummary.inventoryValue}
                  prefix={<WalletOutlined style={{ color: '#52c41a' }} />}
                  precision={2}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Reports
