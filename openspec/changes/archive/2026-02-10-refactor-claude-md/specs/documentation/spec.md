## ADDED Requirements

### Requirement: CLAUDE.md Structure
The CLAUDE.md file SHALL contain only information that Claude Code cannot automatically infer from the codebase.

#### Scenario: Safety rules preserved
- **WHEN** AI reads CLAUDE.md
- **THEN** Critical Safety Rules section MUST be present and unchanged

#### Scenario: Redundant sections removed
- **WHEN** AI reads CLAUDE.md
- **THEN** sections for Development Commands, Type Safety, Testing, Git Conventions SHALL NOT be present

#### Scenario: Pattern references used
- **WHEN** AI needs to understand Excel Export or DatePicker patterns
- **THEN** CLAUDE.md SHALL provide reference links to example files instead of inline code blocks

### Requirement: Line count reduction
The refactored CLAUDE.md SHALL be approximately 130-150 lines (reduced from ~438 lines).

#### Scenario: Concise content
- **WHEN** measuring CLAUDE.md line count
- **THEN** total lines SHALL be between 120-160 lines
