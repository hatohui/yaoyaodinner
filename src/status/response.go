package status

type ErrorResponse struct {
	Code    Code
	Message string `json:"message"`
}

func (e *ErrorResponse) Error() string {
	panic("unimplemented")
}
