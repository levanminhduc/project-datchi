package main

import (
	"context"
	"fmt"
	"log"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func handleEnhance(ctx context.Context, req *mcp.CallToolRequest, input EnhanceInput) (*mcp.CallToolResult, *EnhanceOutput, error) {
	if input.Prompt == "" {
		return nil, nil, fmt.Errorf("prompt is required")
	}
	if input.ProjectRoot == "" {
		return nil, nil, fmt.Errorf("project_root is required")
	}

	enhanced, err := enhancePrompt(input.Prompt, input.ProjectRoot)
	if err != nil {
		return nil, nil, fmt.Errorf("enhance failed: %w", err)
	}

	return nil, &EnhanceOutput{Enhanced: enhanced}, nil
}

func main() {
	server := mcp.NewServer(&mcp.Implementation{
		Name:    "enhance-prompt",
		Version: "1.0.0",
	}, nil)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "enhance",
		Description: "Transform a vague prompt into a structured prompt with codebase context. Returns enhanced prompt with Goal, Context, Related Files, Steps, Constraints, and Codebase Search Queries. IMPORTANT: After calling this tool, use the returned 'Codebase Search Queries' section to call codebase-retrieval (e.g. mcp__augment-context-engine__codebase-retrieval) for precise semantic search results before implementing.",
	}, handleEnhance)

	if err := server.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
		log.Fatal(err)
	}
}
