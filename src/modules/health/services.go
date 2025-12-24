package health

import "yaoyao-functions/src/common/status"

type Service interface {
	CheckHealth() error
	CheckDatabaseConnection() error
	CheckRedisConnection() error
}

type service struct{
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) CheckDatabaseConnection() error {
	isConnected := s.repo.GetDatabaseConnection()

	if !isConnected {
		return &status.ErrorResponse{
			Code:    status.ServiceUnavailable,
			Message: "Failed to connect to the database",
		}
	}

	return nil
}

func (s *service) CheckRedisConnection() error {
	isConnected := s.repo.GetRedisConnection()

	if !isConnected {
		return &status.ErrorResponse{
			Code:    status.ServiceUnavailable,
			Message: "Failed to connect to Redis",
		}
	}

	return nil
}

func (s *service) CheckHealth() error {
	if err := s.CheckDatabaseConnection(); err != nil {
		return err
	}

	if err := s.CheckRedisConnection(); err != nil {
		return err
	}

	return nil
}