package main

import (
	"fmt"
	"path/filepath"
	"strings"
)

type EnhanceInput struct {
	Prompt      string `json:"prompt" jsonschema:"The original prompt to enhance"`
	ProjectRoot string `json:"project_root" jsonschema:"Absolute path to the project root directory"`
}

type EnhanceOutput struct {
	Enhanced string `json:"enhanced"`
}

func analyzeIntent(prompt string) string {
	lower := strings.ToLower(prompt)

	bugKeywords := []string{"fix", "lỗi", "bug", "error", "sửa lỗi", "không hoạt động", "không hiển thị", "bị lỗi", "debug", "crash"}
	for _, kw := range bugKeywords {
		if strings.Contains(lower, kw) {
			return "bugfix"
		}
	}

	featureKeywords := []string{"thêm", "tạo", "add", "create", "new", "implement", "feature", "tính năng", "chức năng"}
	for _, kw := range featureKeywords {
		if strings.Contains(lower, kw) {
			return "feature"
		}
	}

	refactorKeywords := []string{"refactor", "tái cấu trúc", "chuyển", "tách", "gộp", "rename", "đổi tên", "optimize", "tối ưu"}
	for _, kw := range refactorKeywords {
		if strings.Contains(lower, kw) {
			return "refactor"
		}
	}

	updateKeywords := []string{"sửa", "update", "cập nhật", "thay đổi", "change", "modify", "chỉnh"}
	for _, kw := range updateKeywords {
		if strings.Contains(lower, kw) {
			return "update"
		}
	}

	return "general"
}

func assessVagueness(prompt string) string {
	lower := strings.ToLower(prompt)

	hasFilePath := strings.Contains(lower, "/") || strings.Contains(lower, "\\") ||
		strings.Contains(lower, ".ts") || strings.Contains(lower, ".vue") ||
		strings.Contains(lower, ".go") || strings.Contains(lower, ".py")

	hasFunctionName := strings.Contains(lower, "()") || strings.Contains(lower, "function ") ||
		strings.Contains(lower, "func ") || strings.Contains(lower, "def ")

	if hasFilePath || hasFunctionName {
		return "low"
	}

	wordCount := len(strings.Fields(prompt))
	if wordCount <= 5 {
		return "high"
	}

	return "medium"
}

func enhancePrompt(prompt string, projectRoot string) (string, error) {
	intent := analyzeIntent(prompt)
	vagueness := assessVagueness(prompt)

	conventions := ""
	conventionFiles := []string{"CLAUDE.md", "CONVENTIONS.md", "CONTRIBUTING.md", ".cursorrules"}
	for _, cf := range conventionFiles {
		content, err := readFileContent(filepath.Join(projectRoot, cf), 8*1024)
		if err == nil && content != "" {
			conventions = content
			break
		}
	}

	stack := detectStack(projectRoot)

	dirs, _ := scanProjectStructure(projectRoot, 3)

	keywords := extractKeywords(prompt)
	maxSearchFiles := 10
	if vagueness == "high" {
		maxSearchFiles = 15
	}
	relatedFiles, _ := searchFiles(projectRoot, keywords, maxSearchFiles)

	var builder strings.Builder

	builder.WriteString("## Goal\n")
	builder.WriteString(buildGoalSection(prompt, intent))
	builder.WriteString("\n\n")

	builder.WriteString("## Context\n")
	builder.WriteString(fmt.Sprintf("- **Stack**: %s\n", stack))
	builder.WriteString(fmt.Sprintf("- **Intent**: %s\n", intentLabel(intent)))
	builder.WriteString(fmt.Sprintf("- **Vagueness**: %s\n", vaguenessLabel(vagueness)))

	if conventions != "" {
		builder.WriteString("- **Conventions file**: Detected (see constraints below)\n")
	}

	if len(dirs) > 0 {
		builder.WriteString("- **Project structure**:\n")
		shown := 0
		for _, d := range dirs {
			if shown >= 15 {
				builder.WriteString(fmt.Sprintf("  - ... (%d more directories)\n", len(dirs)-shown))
				break
			}
			builder.WriteString(fmt.Sprintf("  - `%s/`\n", d))
			shown++
		}
	}
	builder.WriteString("\n")

	if len(relatedFiles) > 0 {
		builder.WriteString("## Related Files\n")
		for _, f := range relatedFiles {
			category := categorizeFile(f.Path)
			builder.WriteString(fmt.Sprintf("- `%s` — %s (relevance: %d)\n", f.Path, category, f.Score))
		}
		builder.WriteString("\n")
	}

	builder.WriteString("## Implementation Steps\n")
	builder.WriteString(buildSteps(intent, relatedFiles))
	builder.WriteString("\n")

	if conventions != "" {
		builder.WriteString("## Constraints\n")
		builder.WriteString(extractConstraints(conventions))
		builder.WriteString("\n")
	}

	builder.WriteString("## Codebase Search Queries\n")
	builder.WriteString("**IMPORTANT: Use `mcp__augment-context-engine__codebase-retrieval` with these queries to find precise file locations and code patterns before implementing.**\n\n")
	queries := buildSearchQueries(prompt, intent, keywords, relatedFiles)
	for i, q := range queries {
		builder.WriteString(fmt.Sprintf("%d. `%s`\n", i+1, q))
	}
	builder.WriteString("\n")

	return builder.String(), nil
}

func buildGoalSection(prompt string, intent string) string {
	switch intent {
	case "bugfix":
		return fmt.Sprintf("Debug và fix: %s", prompt)
	case "feature":
		return fmt.Sprintf("Implement tính năng: %s", prompt)
	case "refactor":
		return fmt.Sprintf("Refactor: %s", prompt)
	case "update":
		return fmt.Sprintf("Cập nhật: %s", prompt)
	default:
		return prompt
	}
}

func intentLabel(intent string) string {
	labels := map[string]string{
		"bugfix":   "Bug Fix",
		"feature":  "New Feature",
		"refactor": "Refactor",
		"update":   "Update/Modify",
		"general":  "General",
	}
	if l, ok := labels[intent]; ok {
		return l
	}
	return intent
}

func vaguenessLabel(v string) string {
	labels := map[string]string{
		"low":    "Low (specific file/function mentioned)",
		"medium": "Medium (feature/bug described but no exact location)",
		"high":   "High (very generic — needs deep codebase exploration)",
	}
	if l, ok := labels[v]; ok {
		return l
	}
	return v
}

func buildSteps(intent string, files []ScoredFile) string {
	if len(files) == 0 {
		return "1. Explore codebase to find relevant files\n2. Analyze current implementation\n3. Implement changes\n4. Test the changes\n"
	}

	var steps strings.Builder
	step := 1

	layerOrder := []string{"Database Migration", "SQL", "Type Definition", "API Route", "Middleware", "Service Layer", "Composable", "Component", "Page"}
	filesByLayer := make(map[string][]string)

	for _, f := range files {
		cat := categorizeFile(f.Path)
		filesByLayer[cat] = append(filesByLayer[cat], f.Path)
	}

	switch intent {
	case "bugfix":
		steps.WriteString(fmt.Sprintf("%d. Check browser DevTools / server logs for error details\n", step))
		step++
		for _, layer := range layerOrder {
			if paths, ok := filesByLayer[layer]; ok {
				for _, p := range paths {
					steps.WriteString(fmt.Sprintf("%d. Investigate `%s` (%s)\n", step, p, layer))
					step++
				}
			}
		}
		steps.WriteString(fmt.Sprintf("%d. Apply fix and test\n", step))
	case "feature":
		for _, layer := range layerOrder {
			if paths, ok := filesByLayer[layer]; ok {
				for _, p := range paths {
					steps.WriteString(fmt.Sprintf("%d. Reference `%s` for %s pattern\n", step, p, layer))
					step++
				}
			}
		}
		steps.WriteString(fmt.Sprintf("%d. Implement following the patterns above\n", step))
		step++
		steps.WriteString(fmt.Sprintf("%d. Test the new feature\n", step))
	default:
		for _, f := range files {
			cat := categorizeFile(f.Path)
			steps.WriteString(fmt.Sprintf("%d. Modify `%s` (%s)\n", step, f.Path, cat))
			step++
		}
		steps.WriteString(fmt.Sprintf("%d. Verify changes\n", step))
	}

	return steps.String()
}

func extractConstraints(conventions string) string {
	var constraints strings.Builder
	lines := strings.Split(conventions, "\n")

	patterns := []string{"DON'T", "NEVER", "KHÔNG", "Anti-pattern", "MUST", "ALWAYS", "PHẢI", "LUÔN"}
	tableMode := false
	found := 0

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if strings.Contains(trimmed, "Anti-pattern") || strings.Contains(trimmed, "Don't") {
			tableMode = true
		}
		if tableMode && trimmed == "" {
			tableMode = false
		}

		if tableMode && strings.HasPrefix(trimmed, "|") {
			constraints.WriteString(trimmed + "\n")
			found++
			continue
		}

		for _, p := range patterns {
			if strings.Contains(trimmed, p) && len(trimmed) > 10 && len(trimmed) < 200 {
				constraints.WriteString(fmt.Sprintf("- %s\n", trimmed))
				found++
				break
			}
		}

		if found >= 20 {
			break
		}
	}

	if found == 0 {
		return "- Follow project conventions from CLAUDE.md / CONVENTIONS.md\n"
	}

	return constraints.String()
}

func buildSearchQueries(prompt string, intent string, keywords []string, files []ScoredFile) []string {
	var queries []string

	queries = append(queries, prompt)

	switch intent {
	case "bugfix":
		queries = append(queries, fmt.Sprintf("error handling and validation for %s", strings.Join(keywords, " ")))
		if len(files) > 0 {
			queries = append(queries, fmt.Sprintf("how %s is used and called", files[0].Path))
		}
	case "feature":
		queries = append(queries, fmt.Sprintf("existing implementation similar to %s", strings.Join(keywords, " ")))
		queries = append(queries, fmt.Sprintf("API routes and services related to %s", strings.Join(keywords, " ")))
		queries = append(queries, fmt.Sprintf("Vue pages and components for %s", strings.Join(keywords, " ")))
	case "refactor":
		queries = append(queries, fmt.Sprintf("all usages and references of %s", strings.Join(keywords, " ")))
		queries = append(queries, fmt.Sprintf("imports and dependencies for %s", strings.Join(keywords, " ")))
	case "update":
		queries = append(queries, fmt.Sprintf("current implementation of %s", strings.Join(keywords, " ")))
		if len(files) > 0 {
			queries = append(queries, fmt.Sprintf("functions and types in %s", files[0].Path))
		}
	default:
		queries = append(queries, fmt.Sprintf("code related to %s", strings.Join(keywords, " ")))
	}

	if len(files) > 0 {
		topFile := files[0].Path
		cat := categorizeFile(topFile)
		switch cat {
		case "API Route":
			queries = append(queries, fmt.Sprintf("service and composable that calls %s", topFile))
		case "Service Layer":
			queries = append(queries, fmt.Sprintf("API route that %s connects to", topFile))
		case "Page", "Component":
			queries = append(queries, fmt.Sprintf("composable and service used by %s", topFile))
		case "Database Migration":
			queries = append(queries, fmt.Sprintf("routes and services that query the table in %s", topFile))
		}
	}

	if len(queries) > 6 {
		queries = queries[:6]
	}

	return queries
}
