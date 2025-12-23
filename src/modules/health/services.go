package health

import "yaoyao-functions/src/status"

type Service interface {
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