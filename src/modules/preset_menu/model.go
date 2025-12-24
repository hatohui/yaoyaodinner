package preset_menu

type PresetMenu struct {
	ID    string  `gorm:"primaryKey;type:varchar(255);not null" json:"id"`
	Price float64 `gorm:"type:decimal(10,2);not null;default:1;check:price > 0" json:"price"`
	IsActive bool `gorm:"not null;default:true" json:"isActive"`
}

func (PresetMenu) TableName() string {
	return "preset_menu"
}

type PresetMenuFood struct {
	PresetID  string `gorm:"primaryKey;type:varchar(255);not null" json:"presetId"`
	VariantID string `gorm:"primaryKey;type:varchar(255);not null" json:"variantId"`
	Quantity  int    `gorm:"default:1;not null;check:quantity > 0" json:"quantity"`
}

func (PresetMenuFood) TableName() string {
	return "preset_menu_food"
}
