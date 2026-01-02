package people

import (
	"errors"
	"yaoyao-functions/src/common/message"
)

type PeopleService interface {
	GetAllPeople() ([]People, error)
}

type service struct {
	peopleRepo PeopleRepository
}

func NewService(repo PeopleRepository) PeopleService {
	return &service{peopleRepo: repo}
}

func (s *service) GetAllPeople() ([]People, error) {
	peopleList, err := s.peopleRepo.GetAllPeople()
	
	if err != nil {
		return nil, err
	}

	if len(peopleList) == 0 {
		return nil, errors.New(message.NoPeopleFound)
	}

	return peopleList, nil
}