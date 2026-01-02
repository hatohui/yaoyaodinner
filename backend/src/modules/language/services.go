package language

type LanguageService interface {
	GetAllLanguages() ([]Language, error)
	GetLanguageCodeList() ([]string, error)
}

type languageService struct {
	languageRepo LanguageRepository
}

func NewService(repo LanguageRepository) LanguageService {
	return &languageService{languageRepo: repo}
}

func (s *languageService) GetAllLanguages() ([]Language, error) {
	return s.languageRepo.FetchAllLanguages()
}

func (s *languageService) GetLanguageCodeList() ([]string, error) {
	return s.languageRepo.GetLanguageCodeList()
} 