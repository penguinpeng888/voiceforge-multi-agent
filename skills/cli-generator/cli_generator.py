#!/usr/bin/env python3
"""OpenClaw CLI Generator"""
import click
import json
import shutil
from pathlib import Path

BACKEND = Path("/root/.openclaw/workspace/CLI-Anything")
OUTPUT = Path("/root/.openclaw/workspace/cli-generated")

class Gen:
    def __init__(self, name):
        self.name = name
        self.out = OUTPUT / name
        
    def run(self):
        self.out.mkdir(parents=True, exist_ok=True)
        
        # Check CLI-Anything
        harness = BACKEND / self.name / "agent-harness"
        if harness.exists():
            shutil.copytree(harness, self.out / "agent-harness", dirs_exist_ok=True)
            click.echo(f"OK: {self.out}/agent-harness")
        else:
            # Create basic CLI
            (self.out / "cli_anything" / self.name).mkdir(parents=True, exist_ok=True)
            (self.out / "cli_anything" / self.name / "__init__.py").write_text('"""\n')
            click.echo(f"OK: basic CLI created")

@click.command()
@click.argument("name")
def main(name):
    Gen(name).run()

if __name__ == "__main__":
    main()
