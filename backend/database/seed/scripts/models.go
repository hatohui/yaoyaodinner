package scripts

// CategoryData represents a single category entry
type CategoryData struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

// CategoryTranslationData represents a translated category name and description
type CategoryTranslationData struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

// CategorySeedData represents the entire categories JSON structure
type CategorySeedData struct {
	Categories   []CategoryData                         `json:"categories"`
	Translations map[string][]CategoryTranslationData `json:"translations"`
}

// FoodVariantData represents a food variant
type FoodVariantData struct {
	Label      string   `json:"label"`
	Price      *float64 `json:"price"`
	Currency   string   `json:"currency"`
	IsSeasonal bool     `json:"isSeasonal"`
}

// FoodTranslationData represents a translated food name and description
type FoodTranslationData struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

// FoodItem represents a single food item with variants and translations
type FoodItem struct {
	Name         string                         `json:"name"`
	Description  *string                        `json:"description"`
	ImageURL     *string                        `json:"imageUrl"`
	Variants     []FoodVariantData              `json:"variants"`
	Translations map[string]FoodTranslationData `json:"translations"`
}

// FoodDataset represents a collection of food items for a category
type FoodDataset struct {
	Key   string     `json:"key"`
	Items []FoodItem `json:"items"`
}

// TableData represents a table entry
type TableData struct {
	Name     string `json:"name"`
	Capacity int    `json:"capacity"`
}
