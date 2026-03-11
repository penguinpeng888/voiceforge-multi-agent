# CLI Generator Skill

## Purpose
Generate CLI interfaces for software, making it accessible to AI agents. Based on CLI-Anything methodology, adapted for OpenClaw.

## When to Use
- User wants to control a software via AI
- Need to create agent-native CLI for any application
- Automating software that only has GUI

## Pipeline (7 Stages)

### Stage 1: Analyze
1. Identify backend engine
2. Map GUI actions to API calls
3. Identify data model (file formats)
4. Find existing CLI tools
5. Catalog command system

### Stage 2: Design
1. Choose interaction model (REPL vs subcommand)
2. Define command groups
3. Design state model
4. Plan output format (JSON + human-readable)

### Stage 3: Implement
1. Data layer (file manipulation)
2. Probe/info commands
3. Mutation commands
4. Backend integration (call real software)
5. Session management (undo/redo)
6. REPL interface

### Stage 4: Test Planning
Create TEST.md with:
- Test inventory
- Unit test plan
- E2E test plan
- Workflow scenarios

### Stage 5: Test Implementation
- Unit tests (synthetic data)
- E2E tests (intermediate files)
- E2E tests (real backend)
- CLI subprocess tests

### Stage 6: Documentation
Update TEST.md with results

### Stage 7: Publish
- Create setup.py
- Make pip installable
- Publish to PyPI

## Key Principles
1. **Use real software** - Call actual application, don't reimplement
2. **Hard dependency** - Software must be installed
3. **JSON output** - For agent parsing
4. **REPL mode** - Interactive sessions

## Usage

```bash
# Analyze a software
cli-generator analyze <software-path>

# Design CLI architecture
cli-generator design <software-name>

# Implement CLI
cli-generator implement <software-name>

# Run tests
cli-generator test <software-name>
```

## Examples

### FFmpeg
Backend: `ffmpeg -i input -filter ... output`
Format: Binary media files

### GIMP
Backend: `gimp -i -b '(script-fu ...)'`
Format: .xcf, exports to PNG

### LibreOffice
Backend: `libreoffice --headless --convert-to pdf`
Format: .odt/.ods/.odp (ODF ZIP)

## Notes
- Always verify output (not just exit code)
- Document software dependencies clearly
- Use namespace packages for multiple CLIs