package status

type Code string

const (
	// 2xx
	OK                  Code = "ok"
	Created             Code = "created"
	Accepted            Code = "accepted"
	NoContent           Code = "no_content"

	// 3xx
	MultipleChoices    Code = "multiple_choices"
	MovedPermanently   Code = "moved_permanently"
	Found              Code = "found"
	SeeOther           Code = "see_other"
	NotModified       Code = "not_modified"
	TemporaryRedirect Code = "temporary_redirect"
	PermanentRedirect Code = "permanent_redirect"

	// 4xx
	InvalidRequest      Code = "invalid_request"
	ValidationError     Code = "validation_error"
	Unauthorized        Code = "unauthorized"
	Forbidden           Code = "forbidden"
	NotFound            Code = "not_found"
	Conflict            Code = "conflict"
	RateLimited         Code = "rate_limited"

	// 5xx
	InternalServer      Code = "internal_server_error"
	ServiceUnavailable Code = "service_unavailable"
	Timeout             Code = "timeout"
)
