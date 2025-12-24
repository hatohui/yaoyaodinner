package common

const (
	LAMBDA_NAME_ENV = "AWS_LAMBDA_FUNCTION_NAME"
)

// Database table names
const (
	TABLE_LANGUAGE             = "language"
	TABLE_CATEGORY             = "category"
	TABLE_CATEGORY_TRANSLATION = "category_translation"
	TABLE_FOOD                 = "food"
	TABLE_FOOD_VARIANT         = "food_variant"
	TABLE_FOOD_TRANSLATION     = "food_translation"
	TABLE_TABLE                = "table"
	TABLE_PEOPLE               = "people"
	TABLE_PERSONAL_NOTE        = "personal_note"
	TABLE_ACCOUNT              = "account"
	TABLE_ORDER                = "order"
	TABLE_FEEDBACK             = "feedback"
	TABLE_PRESET_MENU          = "preset_menu"
	TABLE_PRESET_MENU_FOOD     = "preset_menu_food"
)

const (
	REDIS_KEY_LANGUAGE_LIST  = "language:list"
	REDIS_KEY_LANGUAGE_CODES = "language:codes"
)