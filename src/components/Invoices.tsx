import React, { useEffect, useState } from 'react'
import {
  Table, Button, Modal, Form, Input, InputNumber, Select, Space,
  Popconfirm, message, Tag, Descriptions, Divider, Drawer, DatePicker,
} from 'antd'
import {
  PlusOutlined, EyeOutlined, DeleteOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { Invoice, InvoiceItem, Customer, Product } from '../types'

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [lineItems, setLineItems] = useState<any[]>([])
  const [form] = Form.useForm()
  const [itemForm] = Form.useForm()

  const loadInvoices = () => {
    setLoading(true)
    window.api.invoices.getAll().then((data) => {
      setInvoices(data)
      setLoading(false)
    })
  }

  useEffect(() => { loadInvoices() }, [])

  const loadCustomersAndProducts = async () => {
    const [c, p] = await Promise.all([
      window.api.customers.getAll(),
      window.api.products.getAll(),
    ])
    setCustomers(c)
    setProducts(p)
  }

  const openNewInvoice = () => {
    loadCustomersAndProducts()
    form.resetFields()
    form.setFieldValue('date', dayjs())
    form.setFieldValue('tax_rate', 10)
    form.setFieldValue('discount', 0)
    setLineItems([])
    setNewInvoiceOpen(true)
  }

  const openDetail = async (id: number) => {
    const inv = await window.api.invoices.getById(id)
    setSelectedInvoice(inv)
    setDetailOpen(true)
  }

  const handleMarkPaid = async (id: number) => {
    await window.api.invoices.updateStatus(id, 'paid')
    message.success('Invoice marked as paid')
    setDetailOpen(false)
    loadInvoices()
  }

  const handleDelete = async (id: number) => {
    await window.api.invoices.delete(id)
    message.success('Invoice deleted')
    loadInvoices()
  }

  const addLineItem = () => {
    itemForm.validateFields().then((values) => {
      const product = products.find((p) => p.id === values.product_id)
      if (!product) return

      let unitPrice = product.price
      let rentalPeriod = ''

      if (product.type === 'rentable') {
        rentalPeriod = values.rental_period || 'Daily'
        unitPrice = rentalPeriod === 'Hourly'
          ? product.rental_hourly
          : rentalPeriod === 'Daily'
            ? product.rental_daily
            : product.rental_monthly
      }

      const total = unitPrice * values.quantity

      setLineItems([...lineItems, {
        key: Date.now(),
        product_id: product.id,
        product_name: product.name,
        quantity: values.quantity,
        unit_price: unitPrice,
        total,
        rental_period: rentalPeriod,
      }])
      itemForm.resetFields()
    })
  }

  const removeLineItem = (key: number) => {
    setLineItems(lineItems.filter((li) => li.key !== key))
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((s, li) => s + li.total, 0)
    const taxRate = form.getFieldValue('tax_rate') || 0
    const discount = form.getFieldValue('discount') || 0
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount - discount
    return { subtotal, taxRate, taxAmount, discount, total }
  }

  const handleSaveInvoice = async () => {
    const values = await form.validateFields()
    const { subtotal, taxRate, taxAmount, discount, total } = calculateTotals()

    if (lineItems.length === 0) {
      message.error('Please add at least one item')
      return
    }

    await window.api.invoices.create({
      customer_id: values.customer_id || null,
      date: values.date.format('YYYY-MM-DD'),
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount,
      total,
      notes: values.notes || '',
      items: lineItems.map((li) => ({
        product_id: li.product_id,
        product_name: li.product_name,
        quantity: li.quantity,
        unit_price: li.unit_price,
        total: li.total,
        rental_period: li.rental_period,
      })),
    })

    message.success('Invoice created')
    setNewInvoiceOpen(false)
    loadInvoices()
  }

  const totals = calculateTotals()

  const columns = [
    { title: 'Invoice No', dataIndex: 'invoice_no', key: 'invoice_no' },
    {
      title: 'Date', dataIndex: 'date', key: 'date',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
      sorter: (a: Invoice, b: Invoice) => a.date.localeCompare(b.date),
    },
    { title: 'Customer', dataIndex: 'customer_name', key: 'customer_name' },
    {
      title: 'Total', dataIndex: 'total', key: 'total',
      render: (v: number) => `₹${v.toFixed(2)}`,
      sorter: (a: Invoice, b: Invoice) => a.total - b.total,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'paid' ? 'green' : s === 'unpaid' ? 'orange' : 'red'}>
          {s.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: Invoice) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(r.id)}>View</Button>
          <Popconfirm title="Delete this invoice?" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Invoices</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNewInvoice}>New Invoice</Button>
      </div>

      <Table dataSource={invoices} columns={columns} rowKey="id" loading={loading} />

      <Drawer
        title={`Invoice #${selectedInvoice?.invoice_no}`}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={500}
        extra={
          selectedInvoice?.status === 'unpaid' && (
            <Button type="primary" style={{ background: '#52c41a' }} onClick={() => handleMarkPaid(selectedInvoice.id)}>
              Mark Paid
            </Button>
          )
        }
      >
        {selectedInvoice && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Invoice No">{selectedInvoice.invoice_no}</Descriptions.Item>
              <Descriptions.Item label="Date">{dayjs(selectedInvoice.date).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedInvoice.status === 'paid' ? 'green' : 'orange'}>
                  {selectedInvoice.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Customer">{selectedInvoice.customer_name || 'Walk-in'}</Descriptions.Item>
              {selectedInvoice.notes && (
                <Descriptions.Item label="Notes">{selectedInvoice.notes}</Descriptions.Item>
              )}
            </Descriptions>
            <Divider>Items</Divider>
            <Table
              dataSource={selectedInvoice.items}
              columns={[
                { title: 'Product', dataIndex: 'product_name', key: 'product_name' },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                {
                  title: 'Rate', dataIndex: 'unit_price', key: 'unit_price',
                  render: (v: number) => `₹${v.toFixed(2)}`,
                },
                {
                  title: 'Rental Period', dataIndex: 'rental_period', key: 'rental_period',
                  render: (v: string) => v || '-',
                },
                {
                  title: 'Total', dataIndex: 'total', key: 'total',
                  render: (v: number) => `₹${v.toFixed(2)}`,
                },
              ]}
              rowKey="id"
              pagination={false}
              size="small"
            />
            <Divider />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Subtotal">₹{selectedInvoice.subtotal.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label={`Tax (${selectedInvoice.tax_rate}%)`}>₹{selectedInvoice.tax_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Discount">-₹{selectedInvoice.discount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label={<strong>Total</strong>}>
                <strong>₹{selectedInvoice.total.toFixed(2)}</strong>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>

      <Modal
        title="New Invoice"
        open={newInvoiceOpen}
        onOk={handleSaveInvoice}
        onCancel={() => setNewInvoiceOpen(false)}
        okText="Create Invoice"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="customer_id" label="Customer" style={{ width: 250 }}>
              <Select allowClear placeholder="Walk-in customer">
                {customers.map((c) => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>

        <Divider>Line Items</Divider>

        <Form form={itemForm} layout="inline" style={{ marginBottom: 12 }}>
          <Form.Item name="product_id" rules={[{ required: true, message: 'Select product' }]}>
            <Select placeholder="Select product" style={{ width: 250 }} showSearch filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase()?.includes(input.toLowerCase())
            }>
              {products.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name} {p.type === 'sellable' ? `(₹${p.price})` : '(Rentable)'} [Stock: {p.stock_qty}]
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" rules={[{ required: true, message: 'Qty' }]}>
            <InputNumber min={1} placeholder="Qty" />
          </Form.Item>
          <Form.Item name="rental_period" label="Period">
            <Select placeholder="Period" style={{ width: 120 }} allowClear>
              <Select.Option value="Hourly">Hourly</Select.Option>
              <Select.Option value="Daily">Daily</Select.Option>
              <Select.Option value="Monthly">Monthly</Select.Option>
            </Select>
          </Form.Item>
          <Button type="dashed" onClick={addLineItem}>+ Add</Button>
        </Form>

        <Table
          dataSource={lineItems}
          columns={[
            { title: 'Product', dataIndex: 'product_name', key: 'product_name' },
            { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
            { title: 'Rate', dataIndex: 'unit_price', key: 'unit_price', render: (v: number) => `₹${v.toFixed(2)}` },
            { title: 'Period', dataIndex: 'rental_period', key: 'rental_period', render: (v: string) => v || '-' },
            { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `₹${v.toFixed(2)}` },
            {
              title: '', key: 'action',
              render: (_: any, r: any) => (
                <Button type="link" danger size="small" onClick={() => removeLineItem(r.key)}>Remove</Button>
              ),
            },
          ]}
          rowKey="key"
          pagination={false}
          size="small"
        />

        <Divider />
        <div style={{ textAlign: 'right' }}>
          <p>Subtotal: ₹{totals.subtotal.toFixed(2)}</p>
          <Space size="small">
            <span>Tax Rate:</span>
            <Form.Item form={form} name="tax_rate" noStyle>
              <InputNumber min={0} max={100} style={{ width: 80 }} />
            </Form.Item>
            <span>%</span>
          </Space>
          <p style={{ marginTop: 8 }}>Tax Amount: ₹{totals.taxAmount.toFixed(2)}</p>
          <Space size="small">
            <span>Discount:</span>
            <Form.Item form={form} name="discount" noStyle>
              <InputNumber min={0} style={{ width: 120 }} prefix="₹" />
            </Form.Item>
          </Space>
          <p style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>
            Total: ₹{totals.total.toFixed(2)}
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default Invoices
