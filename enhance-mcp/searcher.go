package main

import (
	"bufio"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type SearchResult struct {
	File    string `json:"file"`
	Line    int    `json:"line"`
	Content string `json:"content"`
}

type ScoredFile struct {
	Path  string
	Score int
}

func extractKeywords(prompt string) []string {
	stopWords := map[string]bool{
		"thêm": true, "tạo": true, "sửa": true, "xóa": true, "fix": true,
		"add": true, "create": true, "update": true, "delete": true, "remove": true,
		"trang": true, "page": true, "chức": true, "năng": true, "feature": true,
		"lỗi": true, "bug": true, "error": true, "không": true, "được": true,
		"the": true, "a": true, "an": true, "is": true, "are": true,
		"for": true, "to": true, "in": true, "of": true, "and": true,
		"with": true, "from": true, "that": true, "this": true, "it": true,
		"có": true, "và": true, "của": true, "cho": true, "với": true,
		"các": true, "những": true, "một": true, "đã": true, "đang": true,
		"sẽ": true, "cần": true, "phải": true, "nên": true, "bị": true,
		"mới": true, "cũ": true, "hiện": true, "tại": true,
	}

	words := strings.Fields(strings.ToLower(prompt))
	var keywords []string
	for _, w := range words {
		w = strings.Trim(w, ".,;:!?()[]{}\"'`")
		if len(w) >= 2 && !stopWords[w] {
			keywords = append(keywords, w)
		}
	}
	return keywords
}

func searchFiles(root string, keywords []string, maxResults int) ([]ScoredFile, error) {
	rootAbs, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	rootAbs = filepath.Clean(rootAbs)

	dataFilePatterns := []string{"data_full", "data_import", "data_export", "seed", "dump"}

	scoreMap := make(map[string]int)

	err = filepath.Walk(rootAbs, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		if info.IsDir() {
			base := filepath.Base(path)
			cleanPath := filepath.Clean(path)
			if defaultIgnoreDirs[base] || (strings.HasPrefix(base, ".") && cleanPath != rootAbs) {
				return filepath.SkipDir
			}
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		if !codeExtensions[ext] {
			return nil
		}

		if info.Size() > 512*1024 {
			return nil
		}

		rel, relErr := filepath.Rel(rootAbs, filepath.Clean(path))
		if relErr != nil {
			return nil
		}
		relSlash := filepath.ToSlash(rel)
		relLower := strings.ToLower(relSlash)

		isDataFile := false
		for _, pattern := range dataFilePatterns {
			if strings.Contains(relLower, pattern) {
				isDataFile = true
				break
			}
		}
		if isDataFile {
			return nil
		}

		for _, kw := range keywords {
			if strings.Contains(relLower, kw) {
				scoreMap[relSlash] += 3
			}
		}

		f, ferr := os.Open(path)
		if ferr != nil {
			return nil
		}
		defer f.Close()

		scanner := bufio.NewScanner(f)
		buf := make([]byte, 0, 64*1024)
		scanner.Buffer(buf, 256*1024)

		lineCount := 0
		for scanner.Scan() {
			lineCount++
			if lineCount > 200 {
				break
			}
			line := strings.ToLower(scanner.Text())
			for _, kw := range keywords {
				if strings.Contains(line, kw) {
					scoreMap[relSlash]++
				}
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	var results []ScoredFile
	for path, score := range scoreMap {
		if score > 0 {
			results = append(results, ScoredFile{Path: path, Score: score})
		}
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	if len(results) > maxResults {
		results = results[:maxResults]
	}

	return results, nil
}

func categorizeFile(path string) string {
	lower := strings.ToLower(path)

	switch {
	case strings.Contains(lower, "migration"):
		return "Database Migration"
	case strings.Contains(lower, "routes/") || strings.Contains(lower, "route/"):
		return "API Route"
	case strings.Contains(lower, "services/") || strings.Contains(lower, "service/"):
		return "Service Layer"
	case strings.Contains(lower, "composables/") || strings.Contains(lower, "composable/"):
		return "Composable"
	case strings.Contains(lower, "pages/") || strings.Contains(lower, "page/"):
		return "Page"
	case strings.Contains(lower, "components/") || strings.Contains(lower, "component/"):
		return "Component"
	case strings.Contains(lower, "types/") || strings.Contains(lower, "type/"):
		return "Type Definition"
	case strings.Contains(lower, "middleware"):
		return "Middleware"
	case strings.Contains(lower, "utils/") || strings.Contains(lower, "util/"):
		return "Utility"
	case strings.Contains(lower, "test") || strings.Contains(lower, "spec"):
		return "Test"
	case strings.HasSuffix(lower, ".sql"):
		return "SQL"
	case strings.HasSuffix(lower, ".md"):
		return "Documentation"
	case strings.HasSuffix(lower, ".json") || strings.HasSuffix(lower, ".yaml") || strings.HasSuffix(lower, ".yml"):
		return "Config"
	default:
		return "Source"
	}
}
