import React, { useEffect, useState } from 'react'
import { Card, Form, Input, InputNumber, Button, Spin, message } from 'antd'
import { Settings as SettingsType } from '../types'

const Settings: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api.settings.getAll().then((data: any) => {
      form.setFieldsValue({
        business_name: data.business_name || '',
        business_address: data.business_address || '',
        business_phone: data.business_phone || '',
        business_email: data.business_email || '',
        tax_rate: parseFloat(data.tax_rate || '10'),
        currency: data.currency || 'INR',
        invoice_prefix: data.invoice_prefix || 'INV-',
      })
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const values = form.getFieldsValue()
    const entries = [
      ['business_name', values.business_name],
      ['business_address', values.business_address],
      ['business_phone', values.business_phone],
      ['business_email', values.business_email],
      ['tax_rate', String(values.tax_rate)],
      ['currency', values.currency],
      ['invoice_prefix', values.invoice_prefix],
    ]

    for (const [key, value] of entries) {
      await window.api.settings.set(key, value)
    }

    message.success('Settings saved')
    setSaving(false)
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Settings</h2>
      <Card style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="business_name" label="Business Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="business_address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="business_phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="business_email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="tax_rate" label="Tax Rate (%)">
            <InputNumber min={0} max={100} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="currency" label="Currency Symbol">
            <Input maxLength={5} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="invoice_prefix" label="Invoice Prefix">
            <Input style={{ width: 150 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save Settings
          </Button>
        </Form>
      </Card>
    </div>
  )
}

export default Settings
