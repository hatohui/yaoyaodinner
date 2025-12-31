package people

type People struct {
	ID      string  `gorm:"primaryKey;type:varchar(255)" json:"id"`
	Name    string  `gorm:"type:varchar(255)" json:"name"`
	TableID *string `gorm:"type:varchar(255)" json:"tableId"`
}

func (People) TableName() string {
	return "people"
}
