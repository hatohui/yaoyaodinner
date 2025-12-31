package scripts

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// LoadCategoryData loads category data from a JSON file
func LoadCategoryData(filePath string) (*CategorySeedData, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read category file %s: %w", filePath, err)
	}

	var result CategorySeedData
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse category JSON: %w", err)
	}

	return &result, nil
}

// LoadFoodDataset loads a single food dataset from a JSON file
func LoadFoodDataset(filePath string) (*FoodDataset, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read food file %s: %w", filePath, err)
	}

	var result FoodDataset
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse food JSON: %w", err)
	}

	return &result, nil
}

// LoadAllFoodDatasets loads all food datasets from a directory
func LoadAllFoodDatasets(dirPath string) ([]*FoodDataset, error) {
	var datasets []*FoodDataset

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read food directory %s: %w", dirPath, err)
	}

	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		filePath := filepath.Join(dirPath, entry.Name())
		dataset, err := LoadFoodDataset(filePath)
		if err != nil {
			return nil, fmt.Errorf("failed to load dataset from %s: %w", filePath, err)
		}

		datasets = append(datasets, dataset)
	}

	return datasets, nil
}

// LoadTableData loads table data from a JSON file
func LoadTableData(filePath string) ([]TableData, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read table file %s: %w", filePath, err)
	}

	var result []TableData
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse table JSON: %w", err)
	}

	return result, nil
}
