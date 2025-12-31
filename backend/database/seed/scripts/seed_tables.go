package scripts

import (
	"fmt"
	"log"
	"yaoyao-functions/src/modules/table"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func SeedTables(db *gorm.DB, dataFilePath string) error {
	log.Println("🌱 Seeding tables...")

	data, err := LoadTableData(dataFilePath)
	if err != nil {
		return fmt.Errorf("failed to load table data: %w", err)
	}

	for _, t := range data {
		tableID := generateTableID(t.Name)

		tableRecord := table.Table{
			ID:        tableID,
			Name:      t.Name,
			Capacity:  t.Capacity,
			IsStaging: false,
		}

		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"capacity"}),
		}).Create(&tableRecord).Error; err != nil {
			return fmt.Errorf("failed to upsert table %s: %w", t.Name, err)
		}
	}

	log.Printf("✅ Seeded %d tables", len(data))
	return nil
}
