package food

type FoodService interface {
	GetFoodsByPageAndCount(languageCode string, pageNumber int, count int, categoryID string) ([]Food, int64, error)
	AddNewFood(food Food) error
}

type service struct {
	repo FoodRepository
}

func NewService(repo FoodRepository) FoodService {
	return &service{repo: repo}
}

func (s *service) GetFoodsByPageAndCount(languageCode string, pageNumber int, count int, categoryID string) ([]Food, int64, error) {
	total, err := s.repo.GetTotalFoodCount(categoryID)
	
	if err != nil {
		return nil, 0, err
	}

	foods, err := s.repo.GetFoodsByPageAndCount(languageCode, pageNumber, count, categoryID)

	if err != nil {
		return nil, 0, err
	}

	return foods, total, nil
}

func (s *service) AddNewFood(food Food) error {
	err := s.repo.AddNewFood(food)

	if err != nil {
		return err
	}

	return nil
}