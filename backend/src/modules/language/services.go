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
	languages, err := s.languageRepo.FetchAllLanguages()
	
	if err != nil {
		return nil, err
	}

	return languages, nil
}

func (s *languageService) GetLanguageCodeList() ([]string, error) {
	languages, err := s.languageRepo.GetLanguageCodeList()
	
	if err != nil {
		return nil, err
	}

	return languages, nil
}