package repository

import (
	"database/sql"
	"fmt"

	"Rocket-Invo/internal/database"
	"Rocket-Invo/internal/models"
)

type InvoiceRepo struct {
	db *database.DB
}

func NewInvoiceRepo(db *database.DB) *InvoiceRepo {
	return &InvoiceRepo{db}
}

func (r *InvoiceRepo) Create(inv *models.Invoice) (int64, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	res, err := tx.Exec(`
		INSERT INTO invoices (invoice_no, customer_id, date, subtotal, tax_rate, tax_amount, discount, total, notes, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, inv.InvoiceNo, inv.CustomerID, inv.Date, inv.Subtotal, inv.TaxRate, inv.TaxAmount, inv.Discount, inv.Total, inv.Notes, inv.Status)
	if err != nil {
		return 0, err
	}

	invoiceID, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	for _, item := range inv.Items {
		_, err := tx.Exec(`
			INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, total, rental_period)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, invoiceID, item.ProductID, item.ProductName, item.Quantity, item.UnitPrice, item.Total, item.RentalPeriod)
		if err != nil {
			return 0, err
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return invoiceID, nil
}

func (r *InvoiceRepo) GetByID(id int64) (*models.Invoice, error) {
	inv := &models.Invoice{}
	var customerID sql.NullInt64
	err := r.db.QueryRow(`
		SELECT id, invoice_no, customer_id, date, subtotal, tax_rate, tax_amount, discount, total, notes, status
		FROM invoices WHERE id = ?
	`, id).Scan(&inv.ID, &inv.InvoiceNo, &customerID, &inv.Date, &inv.Subtotal, &inv.TaxRate, &inv.TaxAmount, &inv.Discount, &inv.Total, &inv.Notes, &inv.Status)
	if err != nil {
		return nil, err
	}
	if customerID.Valid {
		inv.CustomerID = &customerID.Int64
	}

	items, err := r.getItems(id)
	if err != nil {
		return nil, err
	}
	inv.Items = items

	if inv.CustomerID != nil {
		customerRepo := NewCustomerRepo(r.db)
		customer, err := customerRepo.GetByID(*inv.CustomerID)
		if err == nil {
			inv.Customer = customer
		}
	}

	return inv, nil
}

func (r *InvoiceRepo) GetAll() ([]models.Invoice, error) {
	rows, err := r.db.Query(`
		SELECT id, invoice_no, customer_id, date, subtotal, tax_rate, tax_amount, discount, total, notes, status
		FROM invoices ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []models.Invoice
	for rows.Next() {
		var inv models.Invoice
		var customerID sql.NullInt64
		if err := rows.Scan(&inv.ID, &inv.InvoiceNo, &customerID, &inv.Date, &inv.Subtotal, &inv.TaxRate, &inv.TaxAmount, &inv.Discount, &inv.Total, &inv.Notes, &inv.Status); err != nil {
			return nil, err
		}
		if customerID.Valid {
			inv.CustomerID = &customerID.Int64
		}
		invoices = append(invoices, inv)
	}
	return invoices, rows.Err()
}

func (r *InvoiceRepo) UpdateStatus(id int64, status models.InvoiceStatus) error {
	_, err := r.db.Exec("UPDATE invoices SET status=? WHERE id=?", status, id)
	return err
}

func (r *InvoiceRepo) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM invoices WHERE id=?", id)
	return err
}

func (r *InvoiceRepo) GetNextInvoiceNo(prefix string) (string, error) {
	var num int
	err := r.db.QueryRow(`
		SELECT COALESCE(MAX(CAST(SUBSTR(invoice_no, ?+1) AS INTEGER)), 0) + 1 FROM invoices
	`, len(prefix)).Scan(&num)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s%d", prefix, num), nil
}

func (r *InvoiceRepo) getItems(invoiceID int64) ([]models.InvoiceItem, error) {
	rows, err := r.db.Query(`
		SELECT id, invoice_id, product_id, product_name, quantity, unit_price, total, rental_period
		FROM invoice_items WHERE invoice_id = ?
	`, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.InvoiceItem
	for rows.Next() {
		var item models.InvoiceItem
		var productID sql.NullInt64
		if err := rows.Scan(&item.ID, &item.InvoiceID, &productID, &item.ProductName, &item.Quantity, &item.UnitPrice, &item.Total, &item.RentalPeriod); err != nil {
			return nil, err
		}
		if productID.Valid {
			item.ProductID = &productID.Int64
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
