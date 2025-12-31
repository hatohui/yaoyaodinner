package language

type Language struct {
	Code      string `gorm:"primaryKey;type:varchar(10)" json:"code"`
	Name      string `gorm:"type:varchar(100);not null" json:"name"`
	Direction string `gorm:"type:varchar(10);default:'LTR';not null" json:"direction"`
}

func (Language) TableName() string {
	return "language"
}
