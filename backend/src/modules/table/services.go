package table

import (
	"errors"
	"yaoyao-functions/src/common/message"
)

type TableService interface {
	GetTables() ([]Table, error)
}

type service struct {
	repo TableRepository
}

func NewService(repo TableRepository) TableService {
	return &service{repo: repo}
}

func (s *service) GetTables() ([]Table, error) {
	tables := s.repo.GetTables();

	if tables == nil {
		return nil, errors.New(message.NoTablesFound)
	}

	return tables, nil
}