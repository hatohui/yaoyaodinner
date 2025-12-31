package personal_note

type PersonalNote struct {
	ID       string `gorm:"primaryKey;type:varchar(255);not null" json:"id"`
	PersonID string `gorm:"type:varchar(255);not null" json:"personId"`
	Content  string `gorm:"type:text;not null" json:"content"`
}

func (PersonalNote) TableName() string {
	return "personal_note"
}
