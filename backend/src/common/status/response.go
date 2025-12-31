package status

type ErrorResponse struct {
	Code    Code
	Message string `json:"message"`
}

func (e *ErrorResponse) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return string(e.Code)
}
