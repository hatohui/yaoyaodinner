package account

type Account struct {
	UserID   string `gorm:"primaryKey;type:varchar(255);uniqueIndex;not null;constraint:OnDelete:CASCADE" json:"userId"`
	Username string `gorm:"type:varchar(255);uniqueIndex;not null" json:"username"`
	Password string `gorm:"type:varchar(255);not null" json:"password"`
}

func (Account) TableName() string {
	return "account"
}
