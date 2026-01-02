package language

import (
	"yaoyao-functions/src/common"
	"yaoyao-functions/src/common/database"

	"gorm.io/gorm"
)

type LanguageRepository interface {
	FetchAllLanguages() ([]Language, error)
	GetLanguageCodeList() ([]string, error)
}

type repository struct {
	db          *gorm.DB
}

func NewRepository(db *gorm.DB) LanguageRepository {
	return &repository{db: db}
}

func (r *repository) FetchAllLanguages() ([]Language, error) {
	languages, err  := database.FindAll[Language](r.db, common.TABLE_LANGUAGE)

	if err != nil {
		return nil, err
	}

	return languages, nil
}

func (r *repository) GetLanguageCodeList() ([]string, error) {
	codes, err := database.FindByColumn[string](r.db, common.TABLE_LANGUAGE, "code")

	if err != nil {
		return nil, err
	}
	
	return codes, nil
}
