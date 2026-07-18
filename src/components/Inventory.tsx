import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm, message, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { Product } from '../types'

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()
  const productType = Form.useWatch('type', form)

  const load = () => {
    setLoading(true)
    window.api.products.getAll().then((data) => {
      setProducts(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!modalOpen) return
    if (!editing) {
      form.setFieldValue('type', 'sellable')
    }
  }, [modalOpen])

  const handleSearch = () => {
    if (!search.trim()) { load(); return }
    setLoading(true)
    window.api.products.search(search).then((data) => {
      setProducts(data)
      setLoading(false)
    })
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldValue('type', 'sellable')
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    form.setFieldsValue(p)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    if (editing) {
      await window.api.products.update({ ...editing, ...values })
      message.success('Product updated')
    } else {
      await window.api.products.create(values)
      message.success('Product created')
    }
    setModalOpen(false)
    load()
  }

  const handleDelete = async (id: number) => {
    await window.api.products.delete(id)
    message.success('Product deleted')
    load()
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: Product, b: Product) => a.name.localeCompare(b.name) },
    {
      title: 'Type', dataIndex: 'type', key: 'type',
      render: (t: string) => <Tag color={t === 'sellable' ? 'blue' : 'purple'}>{t}</Tag>,
    },
    {
      title: 'Price / Rate', key: 'price',
      render: (_: any, r: Product) =>
        r.type === 'sellable'
          ? `₹${r.price.toFixed(2)}`
          : `H:₹${r.rental_hourly}/D:₹${r.rental_daily}/M:₹${r.rental_monthly}`,
    },
    { title: 'Stock', dataIndex: 'stock_qty', key: 'stock_qty' },
    {
      title: 'SKU', dataIndex: 'sku', key: 'sku',
      responsive: ['lg' as const],
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: Product) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>Edit</Button>
          <Popconfirm title="Delete this product?" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Inventory</h2>
        <Space>
          <Input.Search
            placeholder="Search by name, SKU or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Product</Button>
        </Space>
      </div>
      <Table dataSource={products} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Edit Product' : 'Add Product'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Save"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="sellable">Sellable</Select.Option>
              <Select.Option value="rentable">Rentable</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU"><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          {productType === 'sellable' ? (
            <>
              <Space style={{ width: '100%' }} size="large">
                <Form.Item name="price" label="Price" rules={[{ required: true }]}>
                  <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="cost" label="Cost">
                  <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
                </Form.Item>
              </Space>
            </>
          ) : (
            <>
              <Space style={{ width: '100%' }} size="large">
                <Form.Item name="rental_hourly" label="Hourly Rate">
                  <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="rental_daily" label="Daily Rate">
                  <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="rental_monthly" label="Monthly Rate">
                  <InputNumber min={0} prefix="₹" style={{ width: '100%' }} />
                </Form.Item>
              </Space>
            </>
          )}
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="stock_qty" label="Stock Qty">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="min_stock" label="Min Stock">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="category" label="Category" style={{ width: '100%' }}>
              <Input />
            </Form.Item>
            <Form.Item name="supplier" label="Supplier" style={{ width: '100%' }}>
              <Input />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

export default Inventory
