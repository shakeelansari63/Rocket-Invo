package repository

import (
	"Rocket-Invo/internal/database"
	"Rocket-Invo/internal/models"
	"time"
)

type CustomerRepo struct {
	db *database.DB
}

func NewCustomerRepo(db *database.DB) *CustomerRepo {
	return &CustomerRepo{db}
}

func (r *CustomerRepo) Create(c *models.Customer) (int64, error) {
	res, err := r.db.Exec(`
		INSERT INTO customers (name, phone, email, address, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, c.Name, c.Phone, c.Email, c.Address, time.Now())
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *CustomerRepo) GetByID(id int64) (*models.Customer, error) {
	c := &models.Customer{}
	err := r.db.QueryRow(`
		SELECT id, name, phone, email, address, created_at
		FROM customers WHERE id = ?
	`, id).Scan(&c.ID, &c.Name, &c.Phone, &c.Email, &c.Address, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *CustomerRepo) GetAll() ([]models.Customer, error) {
	rows, err := r.db.Query(`
		SELECT id, name, phone, email, address, created_at
		FROM customers ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var customers []models.Customer
	for rows.Next() {
		var c models.Customer
		if err := rows.Scan(&c.ID, &c.Name, &c.Phone, &c.Email, &c.Address, &c.CreatedAt); err != nil {
			return nil, err
		}
		customers = append(customers, c)
	}
	return customers, rows.Err()
}

func (r *CustomerRepo) Update(c *models.Customer) error {
	_, err := r.db.Exec(`
		UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?
	`, c.Name, c.Phone, c.Email, c.Address, c.ID)
	return err
}

func (r *CustomerRepo) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM customers WHERE id=?", id)
	return err
}
