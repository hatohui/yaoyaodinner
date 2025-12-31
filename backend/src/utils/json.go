package utils

import (
	"encoding/json"
)

func TryParseJSON(data string, dest interface{}) bool {
	err := json.Unmarshal([]byte(data), dest)
	return err == nil
}

func MarshalJSON(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}

func UnmarshalJSON(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}

func MarshalJSONString(v interface{}) (string, error) {
	bytes, err := json.Marshal(v)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func UnmarshalJSONString(data string, v interface{}) error {
	return json.Unmarshal([]byte(data), v)
}

func ToJSONOrEmpty(v interface{}) string {
	str, _ := MarshalJSONString(v)
	return str
}

func MustMarshal(v interface{}) []byte {
	bytes, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return bytes
}
