package models

import "time"

type InvoiceStatus string

const (
	StatusUnpaid    InvoiceStatus = "unpaid"
	StatusPaid      InvoiceStatus = "paid"
	StatusCancelled InvoiceStatus = "cancelled"
)

type Invoice struct {
	ID         int64         `json:"id"`
	InvoiceNo  string        `json:"invoice_no"`
	CustomerID *int64        `json:"customer_id"`
	Customer   *Customer     `json:"customer,omitempty"`
	Date       time.Time     `json:"date"`
	Subtotal   float64       `json:"subtotal"`
	TaxRate    float64       `json:"tax_rate"`
	TaxAmount  float64       `json:"tax_amount"`
	Discount   float64       `json:"discount"`
	Total      float64       `json:"total"`
	Notes      string        `json:"notes"`
	Status     InvoiceStatus `json:"status"`
	Items      []InvoiceItem `json:"items,omitempty"`
	CreatedAt  time.Time     `json:"created_at"`
}

type InvoiceItem struct {
	ID           int64   `json:"id"`
	InvoiceID    int64   `json:"invoice_id"`
	ProductID    *int64  `json:"product_id"`
	ProductName  string  `json:"product_name"`
	Quantity     int     `json:"quantity"`
	UnitPrice    float64 `json:"unit_price"`
	Total        float64 `json:"total"`
	RentalPeriod string  `json:"rental_period"`
}
