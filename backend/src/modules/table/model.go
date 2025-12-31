package table

type Table struct {
	ID            string  `gorm:"primaryKey;type:varchar(255)" json:"id"`
	Name          string  `gorm:"type:varchar(255);not null;uniqueIndex" json:"name"`
	Capacity      int     `gorm:"default:1;not null" json:"capacity"`
	TableLeaderID *string `gorm:"type:varchar(255);uniqueIndex" json:"tableLeaderId"`
	IsStaging     bool    `gorm:"default:false;not null" json:"isStaging"`
}

func (Table) TableName() string {
	return "table"
}
