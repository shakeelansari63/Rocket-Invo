package models

import "time"

type ProductType string

const (
	ProductSellable ProductType = "sellable"
	ProductRentable ProductType = "rentable"
)

type Product struct {
	ID            int64       `json:"id"`
	Name          string      `json:"name"`
	SKU           string      `json:"sku"`
	Description   string      `json:"description"`
	Type          ProductType `json:"type"`
	Price         float64     `json:"price"`
	Cost          float64     `json:"cost"`
	RentalHourly  float64     `json:"rental_hourly"`
	RentalDaily   float64     `json:"rental_daily"`
	RentalMonthly float64     `json:"rental_monthly"`
	StockQty      int         `json:"stock_qty"`
	MinStock      int         `json:"min_stock"`
	Category      string      `json:"category"`
	Supplier      string      `json:"supplier"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
}
