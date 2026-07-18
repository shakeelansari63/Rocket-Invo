import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Customer } from '../types'

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form] = Form.useForm()

  const load = () => {
    setLoading(true)
    window.api.customers.getAll().then((data) => {
      setCustomers(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    form.setFieldsValue(c)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    if (editing) {
      await window.api.customers.update({ ...editing, ...values })
      message.success('Customer updated')
    } else {
      await window.api.customers.create(values)
      message.success('Customer created')
    }
    setModalOpen(false)
    load()
  }

  const handleDelete = async (id: number) => {
    await window.api.customers.delete(id)
    message.success('Customer deleted')
    load()
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: Customer, b: Customer) => a.name.localeCompare(b.name) },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: Customer) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>Edit</Button>
          <Popconfirm title="Delete this customer?" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Customers</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Customer</Button>
      </div>
      <Table dataSource={customers} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editing ? 'Edit Customer' : 'Add Customer'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input type="email" /></Form.Item>
          <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Customers
