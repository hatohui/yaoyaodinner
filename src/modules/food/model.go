package food

type Food struct {
	ID          string  `gorm:"primaryKey;type:varchar(255)" json:"id"`
	Name        string  `gorm:"type:varchar(255);not null" json:"name"`
	ImageURL    *string `gorm:"type:varchar(500)" json:"imageUrl"`
	Description *string `gorm:"type:text" json:"description"`
	CategoryID  string  `gorm:"type:varchar(255);not null" json:"categoryId"`
	IsAvailable bool    `gorm:"default:true" json:"isAvailable"`
	IsChecked   bool   `gorm:"default:true" json:"isChecked"`
}

func (Food) TableName() string {
	return "food"
}

type FoodTranslation struct {
	FoodID      string  `gorm:"primaryKey;type:varchar(255);not null;constraint:OnDelete:CASCADE" json:"foodId"`
	Language    string  `gorm:"primaryKey;type:varchar(10);not null;constraint:OnDelete:CASCADE" json:"language"`
	Name        string  `gorm:"type:varchar(255);not null" json:"name"`
	Description *string `gorm:"type:text" json:"description"`
}

func (FoodTranslation) TableName() string {
	return "food_translation"
}

type FoodVariant struct {
	ID          string   `gorm:"primaryKey;type:varchar(255);not null" json:"id"`
	FoodID      string   `gorm:"type:varchar(255);not null;constraint:OnDelete:CASCADE" json:"foodId"`
	Label       string   `gorm:"type:varchar(255);not null" json:"label"`
	Price       *float64 `gorm:"type:decimal(10,2)" json:"price"`
	Currency    string   `gorm:"type:varchar(10);default:'RM'" json:"currency"`
	IsSeasonal  bool     `gorm:"default:false" json:"isSeasonal"`
	IsAvailable bool     `gorm:"default:false" json:"isAvailable"`
}

func (FoodVariant) TableName() string {
	return "food_variant"
}
