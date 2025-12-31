package order

import "time"

type Order struct {
	ID        string    `gorm:"primaryKey;type:varchar(255);not null" json:"id"`
	TableID   string    `gorm:"type:varchar(255);not null;constraint:OnDelete:CASCADE" json:"tableId"`
	VariantID string    `gorm:"type:varchar(255);not null;constraint:OnDelete:CASCADE" json:"variantId"`
	Quantity  int       `gorm:"default:1;not null;check:quantity > 0" json:"quantity"`
	Price     float64   `gorm:"type:decimal(10,2);not null;check:price > 0" json:"price"`
	OrderedBy *string   `gorm:"type:varchar(255)" json:"orderedBy"`
	UpdatedAt time.Time `gorm:"not null;autoUpdateTime" json:"updatedAt"`
	CreatedAt time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`
}

func (Order) TableName() string {
	return "order"
}
