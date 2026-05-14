package repository

import "Rocket-Invo/internal/database"

type SettingsRepo struct {
	db *database.DB
}

func NewSettingsRepo(db *database.DB) *SettingsRepo {
	return &SettingsRepo{db}
}

func (r *SettingsRepo) Get(key string) (string, error) {
	var value string
	err := r.db.QueryRow("SELECT value FROM settings WHERE key=?", key).Scan(&value)
	if err != nil {
		return "", err
	}
	return value, nil
}

func (r *SettingsRepo) Set(key, value string) error {
	_, err := r.db.Exec("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, value)
	return err
}

func (r *SettingsRepo) GetAll() (map[string]string, error) {
	rows, err := r.db.Query("SELECT key, value FROM settings")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := make(map[string]string)
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		settings[key] = value
	}
	return settings, rows.Err()
}
