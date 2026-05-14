package repository

import (
	"Rocket-Invo/internal/database"
	"Rocket-Invo/internal/models"
	"time"
)

type ProductRepo struct {
	db *database.DB
}

func NewProductRepo(db *database.DB) *ProductRepo {
	return &ProductRepo{db}
}

func (r *ProductRepo) Create(p *models.Product) (int64, error) {
	res, err := r.db.Exec(`
		INSERT INTO products (name, sku, description, type, price, cost, rental_hourly, rental_daily, rental_monthly, stock_qty, min_stock, category, supplier, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, p.Name, p.SKU, p.Description, p.Type, p.Price, p.Cost, p.RentalHourly, p.RentalDaily, p.RentalMonthly, p.StockQty, p.MinStock, p.Category, p.Supplier, time.Now(), time.Now())
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *ProductRepo) GetByID(id int64) (*models.Product, error) {
	p := &models.Product{}
	err := r.db.QueryRow(`
		SELECT id, name, sku, description, type, price, cost, rental_hourly, rental_daily, rental_monthly, stock_qty, min_stock, category, supplier, created_at, updated_at
		FROM products WHERE id = ?
	`, id).Scan(&p.ID, &p.Name, &p.SKU, &p.Description, &p.Type, &p.Price, &p.Cost, &p.RentalHourly, &p.RentalDaily, &p.RentalMonthly, &p.StockQty, &p.MinStock, &p.Category, &p.Supplier, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *ProductRepo) GetAll() ([]models.Product, error) {
	rows, err := r.db.Query(`
		SELECT id, name, sku, description, type, price, cost, rental_hourly, rental_daily, rental_monthly, stock_qty, min_stock, category, supplier, created_at, updated_at
		FROM products ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.SKU, &p.Description, &p.Type, &p.Price, &p.Cost, &p.RentalHourly, &p.RentalDaily, &p.RentalMonthly, &p.StockQty, &p.MinStock, &p.Category, &p.Supplier, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func (r *ProductRepo) Update(p *models.Product) error {
	_, err := r.db.Exec(`
		UPDATE products SET name=?, sku=?, description=?, type=?, price=?, cost=?, rental_hourly=?, rental_daily=?, rental_monthly=?, stock_qty=?, min_stock=?, category=?, supplier=?, updated_at=?
		WHERE id=?
	`, p.Name, p.SKU, p.Description, p.Type, p.Price, p.Cost, p.RentalHourly, p.RentalDaily, p.RentalMonthly, p.StockQty, p.MinStock, p.Category, p.Supplier, time.Now(), p.ID)
	return err
}

func (r *ProductRepo) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM products WHERE id=?", id)
	return err
}

func (r *ProductRepo) GetLowStock() ([]models.Product, error) {
	rows, err := r.db.Query(`
		SELECT id, name, sku, description, type, price, cost, rental_hourly, rental_daily, rental_monthly, stock_qty, min_stock, category, supplier, created_at, updated_at
		FROM products WHERE stock_qty <= min_stock ORDER BY stock_qty ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.SKU, &p.Description, &p.Type, &p.Price, &p.Cost, &p.RentalHourly, &p.RentalDaily, &p.RentalMonthly, &p.StockQty, &p.MinStock, &p.Category, &p.Supplier, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func (r *ProductRepo) Search(q string) ([]models.Product, error) {
	rows, err := r.db.Query(`
		SELECT id, name, sku, description, type, price, cost, rental_hourly, rental_daily, rental_monthly, stock_qty, min_stock, category, supplier, created_at, updated_at
		FROM products WHERE name LIKE ? OR sku LIKE ? OR category LIKE ? ORDER BY name
	`, "%"+q+"%", "%"+q+"%", "%"+q+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.SKU, &p.Description, &p.Type, &p.Price, &p.Cost, &p.RentalHourly, &p.RentalDaily, &p.RentalMonthly, &p.StockQty, &p.MinStock, &p.Category, &p.Supplier, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}
