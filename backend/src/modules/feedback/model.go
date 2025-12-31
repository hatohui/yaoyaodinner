package feedback

import "time"

type Feedback struct {
	ID        string    `gorm:"primaryKey;type:varchar(255);not null" json:"id"`
	By        *string   `gorm:"type:varchar(255)" json:"by"`
	Content   *string   `gorm:"type:text" json:"content"`
	UpdatedAt time.Time `gorm:"not null;autoUpdateTime" json:"updatedAt"`
	CreatedAt time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`
}

func (Feedback) TableName() string {
	return "feedback"
}
