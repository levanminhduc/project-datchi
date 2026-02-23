package main

import (
	"os"
	"path/filepath"
	"strings"
)

type FileInfo struct {
	Path    string `json:"path"`
	RelPath string `json:"rel_path"`
	IsDir   bool   `json:"is_dir"`
}

var defaultIgnoreDirs = map[string]bool{
	"node_modules": true, ".git": true, "dist": true, "build": true,
	".nuxt": true, ".next": true, ".output": true, "__pycache__": true,
	".venv": true, "vendor": true, ".cache": true, ".turbo": true,
	"coverage": true, ".nyc_output": true, "tmp": true, ".tmp": true,
}

var codeExtensions = map[string]bool{
	".ts": true, ".tsx": true, ".js": true, ".jsx": true,
	".vue": true, ".svelte": true, ".go": true, ".py": true,
	".rs": true, ".java": true, ".kt": true, ".cs": true,
	".sql": true, ".md": true, ".json": true, ".yaml": true,
	".yml": true, ".toml": true, ".css": true, ".scss": true,
	".html": true,
}

func scanProjectStructure(root string, maxDepth int) ([]string, error) {
	var dirs []string
	rootAbs, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	rootAbs = filepath.Clean(rootAbs)

	err = filepath.Walk(rootAbs, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() {
			return nil
		}

		cleanPath := filepath.Clean(path)
		if cleanPath == rootAbs {
			return nil
		}

		base := filepath.Base(cleanPath)
		if defaultIgnoreDirs[base] || strings.HasPrefix(base, ".") {
			return filepath.SkipDir
		}

		rel, relErr := filepath.Rel(rootAbs, cleanPath)
		if relErr != nil {
			return nil
		}
		relSlash := filepath.ToSlash(rel)

		depth := len(strings.Split(relSlash, "/"))
		if depth > maxDepth {
			return filepath.SkipDir
		}

		dirs = append(dirs, relSlash)
		return nil
	})

	return dirs, err
}

func findCodeFiles(root string, maxFiles int) ([]string, error) {
	var files []string
	rootAbs, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}

	err = filepath.Walk(rootAbs, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		if info.IsDir() {
			base := filepath.Base(path)
			if defaultIgnoreDirs[base] || (strings.HasPrefix(base, ".") && path != rootAbs) {
				return filepath.SkipDir
			}
			return nil
		}

		if len(files) >= maxFiles {
			return filepath.SkipAll
		}

		ext := strings.ToLower(filepath.Ext(path))
		if codeExtensions[ext] {
			rel, _ := filepath.Rel(rootAbs, path)
			files = append(files, filepath.ToSlash(rel))
		}

		return nil
	})

	return files, err
}

func readFileContent(path string, maxBytes int64) (string, error) {
	info, err := os.Stat(path)
	if err != nil {
		return "", err
	}

	if info.Size() > maxBytes {
		f, err := os.Open(path)
		if err != nil {
			return "", err
		}
		defer f.Close()

		buf := make([]byte, maxBytes)
		n, err := f.Read(buf)
		if err != nil {
			return "", err
		}
		return string(buf[:n]), nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func detectStack(root string) string {
	indicators := map[string]string{
		"package.json":  "Node.js",
		"go.mod":        "Go",
		"Cargo.toml":    "Rust",
		"pom.xml":       "Java (Maven)",
		"build.gradle":  "Java (Gradle)",
		"requirements.txt": "Python",
		"pyproject.toml":   "Python",
		"composer.json":    "PHP",
	}

	var stacks []string
	for file, stack := range indicators {
		if _, err := os.Stat(filepath.Join(root, file)); err == nil {
			stacks = append(stacks, stack)
		}
	}

	frameworkIndicators := map[string]string{
		"quasar.config":    "Quasar",
		"nuxt.config":      "Nuxt",
		"next.config":      "Next.js",
		"vite.config":      "Vite",
		"angular.json":     "Angular",
		"svelte.config":    "Svelte",
	}

	for prefix, framework := range frameworkIndicators {
		matches, _ := filepath.Glob(filepath.Join(root, prefix+"*"))
		if len(matches) > 0 {
			stacks = append(stacks, framework)
		}
	}

	if _, err := os.Stat(filepath.Join(root, "supabase")); err == nil {
		stacks = append(stacks, "Supabase")
	}

	if len(stacks) == 0 {
		return "Unknown"
	}
	return strings.Join(stacks, " + ")
}
