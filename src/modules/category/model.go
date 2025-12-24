package category

type Category struct {
	ID          string  `gorm:"primaryKey;type:varchar(255);not null" json:"id"`
	Name        string  `gorm:"type:varchar(255);uniqueIndex;not null" json:"name"`
	Description *string `gorm:"type:text" json:"description"`
}

func (Category) TableName() string {
	return "category"
}

type CategoryTranslation struct {
	CategoryID  string  `gorm:"primaryKey;type:varchar(255);not null;constraint:OnDelete:CASCADE" json:"categoryId"`
	Language    string  `gorm:"primaryKey;type:varchar(10);not null;constraint:OnDelete:CASCADE" json:"language"`
	Name        string  `gorm:"type:varchar(255);not null" json:"name"`
	Description *string `gorm:"type:text" json:"description"`
}

func (CategoryTranslation) TableName() string {
	return "category_translation"
}
