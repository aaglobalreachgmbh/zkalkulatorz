#!/usr/bin/env python3
"""
Antigravity Pre-Push Validator
==============================
Self-Annealing System: Prüft bekannte Fehlermuster VOR dem Push.

Verwendung:
    python3 execution/pre_push_check.py

Oder als Git Hook:
    ln -s ../../execution/pre_push_check.py .git/hooks/pre-push
"""

import subprocess
import sys
import os
import re
from pathlib import Path

# Farben für Terminal-Output
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

# Projekt-Root ermitteln
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent


def log(level: str, msg: str):
    """Farbiges Logging"""
    colors = {"ERROR": RED, "WARN": YELLOW, "OK": GREEN, "INFO": BLUE}
    color = colors.get(level, RESET)
    print(f"{color}[{level}]{RESET} {msg}")


def run_cmd(cmd: str, cwd: Path = PROJECT_ROOT) -> tuple[int, str]:
    """Führt Kommando aus und gibt (exit_code, output) zurück"""
    try:
        result = subprocess.run(
            cmd, shell=True, cwd=cwd, capture_output=True, text=True
        )
        return result.returncode, result.stdout + result.stderr
    except Exception as e:
        return 1, str(e)


class ErrorPatternChecker:
    """Prüft bekannte Fehlermuster aus ERROR_PATTERNS.md"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def check_kernel_existence(self) -> bool:
        """CHECKS_000: ANTIGRAVITY_KERNEL.md muss existieren"""
        log("INFO", "Checking for ANTIGRAVITY_KERNEL.md...")
        
        kernel_path = PROJECT_ROOT / "directives/ANTIGRAVITY_KERNEL.md"
        
        if not kernel_path.exists():
            self.errors.append("ERR_000: ANTIGRAVITY_KERNEL.md not found! The System Kernel is missing.")
            return False
        
        log("OK", "System Kernel online")
        return True

    def check_nested_node_modules(self) -> bool:
        """ERR_003: Parasitäre node_modules AUSSERHALB des Root node_modules"""
        log("INFO", "Checking for nested node_modules outside root...")
        
        # Finde node_modules die NICHT im Root sind und NICHT innerhalb von ./node_modules/
        code, output = run_cmd(
            "find . -name 'node_modules' -type d -not -path './node_modules' -not -path './node_modules/*' -not -path './.git/*'"
        )
        
        if output.strip():
            nested = output.strip().split('\n')
            for path in nested:
                if path and path != './node_modules':
                    self.errors.append(f"ERR_003: Parasitäres node_modules gefunden: {path}")
            return False
        
        log("OK", "No parasitic node_modules found")
        return True
    
    def check_icloud_duplicates(self) -> bool:
        """ERR_004: iCloud-Konflikt-Duplikate"""
        log("INFO", "Checking for iCloud conflict duplicates...")
        
        code, output = run_cmd(
            "find . \\( -name '* 2.*' -o -name '* 3.*' \\) -not -path './node_modules/*' -not -path './.git/*' -not -path './knowledge/*' -type f"
        )
        
        if output.strip():
            duplicates = output.strip().split('\n')
            for path in duplicates:
                if path:
                    self.errors.append(f"ERR_004: iCloud-Duplikat gefunden: {path}")
            return False
        
        log("OK", "No iCloud duplicates found")
        return True
    
    def check_duplicate_configs(self) -> bool:
        """ERR_005: Doppelte Config-Dateien"""
        log("INFO", "Checking for duplicate config files...")
        
        # package.json nur im Root erlaubt
        code, output = run_cmd(
            "find . -name 'package.json' -not -path './node_modules/*' | grep -v '^./package.json$'"
        )
        
        if output.strip():
            for path in output.strip().split('\n'):
                if path:
                    self.warnings.append(f"ERR_005: Doppelte package.json: {path}")
        
        # tsconfig nur im Root erlaubt
        code, output = run_cmd(
            "find . -name 'tsconfig*.json' -not -path './node_modules/*'"
        )
        
        configs = [c for c in output.strip().split('\n') if c]
        root_configs = ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json']
        
        for config in configs:
            if config not in root_configs:
                self.warnings.append(f"ERR_005: Doppelte tsconfig: {config}")
        
        if not self.warnings:
            log("OK", "No duplicate configs found")
        
        return len([w for w in self.warnings if "ERR_005" in w]) == 0
    
    def check_build(self) -> bool:
        """Build-Verifizierung"""
        log("INFO", "Running build verification...")
        
        code, output = run_cmd("npm run build")
        
        if code != 0:
            self.errors.append("BUILD_FAILED: npm run build fehlgeschlagen")
            # Bekannte Patterns in Build-Output suchen
            if "Cannot find module" in output:
                self.errors.append("ERR_002: Module not found - try: rm -rf node_modules && npm install")
            if "Failed to resolve import" in output:
                self.errors.append("ERR_003: Failed to resolve - check for nested node_modules")
            return False
        
        log("OK", "Build successful")
        return True
    
    def check_lint(self) -> bool:
        """Lint-Check (nur Errors, nicht Warnings)"""
        log("INFO", "Running lint check...")
        
        code, output = run_cmd("npm run lint 2>&1 | grep -E '^\\s+\\d+:\\d+\\s+error'")
        
        if output.strip():
            error_count = len(output.strip().split('\n'))
            self.errors.append(f"LINT_ERRORS: {error_count} ESLint errors found")
            return False
        
        log("OK", "No lint errors")
        return True
    
    def check_typecheck(self) -> bool:
        """TypeScript-Check"""
        log("INFO", "Running TypeScript check...")
        
        code, output = run_cmd("npm run typecheck")
        
        if code != 0:
            self.errors.append("TYPECHECK_FAILED: TypeScript errors found")
            return False
        
        log("OK", "TypeScript check passed")
        return True
    
    def check_anti_patterns(self) -> bool:
        """CHECKS_001: Prüft auf verbotene 'Vibe Coding' Patterns"""
        log("INFO", "Checking for 'Vibe Coding' anti-patterns...")
        
        # Check 1: @ts-ignore (STRICT FORBIDDEN)
        # Grep-Suche in .ts/.tsx Dateien, Ausschluss von node_modules
        code, output = run_cmd(
            "grep -r '// @ts-ignore' src/ --include='*.ts' --include='*.tsx' || true"
        )
        if output.strip():
            count = len(output.strip().split('\n'))
            self.errors.append(f"ANTI_PATTERN: {count}x '// @ts-ignore' detected. This is forbidden! Use proper types.")
        
        # Check 2: console.log (WARNING)
        code, output = run_cmd(
            "grep -r 'console.log' src/ --include='*.ts' --include='*.tsx' || true"
        )
        if output.strip():
            count = len(output.strip().split('\n'))
            self.warnings.append(f"ANTI_PATTERN: {count}x 'console.log' detected. Remove before production.")
            
        if not self.errors:
            log("OK", "No critical anti-patterns found")
            return True
        return False

    def check_design_system(self) -> bool:
        """CHECKS_002: Enforces Design System (Doc 7) - No Hardcoded Colors"""
        log("INFO", "Checking for Design System violations (hardcoded colors)...")
        
        # Grep for hex codes in tsx files (ignoring common config files)
        # We look for # followed by 3 or 6 hex digits, but try to exclude valid use cases if possible.
        # Simple heuristic: alert on arbitrary hex usage in components.
        code, output = run_cmd(
            "grep -rE '#[0-9a-fA-F]{3,6}' src/ --include='*.tsx' --include='*.ts' | grep -v 'tailwind.config' | grep -v 'utils.ts' | grep -v 'constants' || true"
        )
        
        if output.strip():
            count = len(output.strip().split('\n'))
            # Warn initially, don't error yet (too many false positives likely)
            self.warnings.append(f"DESIGN_SYSTEM: {count}x Hardcoded Hex Colors detected. Use Tailwind classes or CSS variables! (Doc 7)")
            # Log first few for user visibility
            for line in output.strip().split('\n')[:3]:
                print(f"    {YELLOW}Violation:{RESET} {line.strip()[:80]}...")
            return False
            
        log("OK", "Design System adherence looks good")
        return True

    def run_all_checks(self) -> bool:
        """Führt alle Checks aus"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}  ANTIGRAVITY PRE-PUSH VALIDATOR{RESET}")
        print(f"{BLUE}  Self-Annealing Error Prevention System{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        # Schnelle Pattern-Checks zuerst
        self.check_kernel_existence()
        self.check_anti_patterns()
        self.check_design_system()
        self.check_nested_node_modules()
        self.check_icloud_duplicates()
        self.check_duplicate_configs()
        
        # Wenn kritische Pattern-Fehler, abbrechen
        if self.errors:
            self._print_results()
            return False
        
        # Dann die langsameren Checks
        self.check_typecheck()
        self.check_lint()
        self.check_build()
        
        self._print_results()
        return len(self.errors) == 0
    
    def _print_results(self):
        """Ergebnisse ausgeben"""
        print(f"\n{BLUE}{'='*60}{RESET}")
        
        if self.errors:
            print(f"{RED}ERRORS ({len(self.errors)}):{RESET}")
            for err in self.errors:
                print(f"  {RED}✗{RESET} {err}")
        
        if self.warnings:
            print(f"{YELLOW}WARNINGS ({len(self.warnings)}):{RESET}")
            for warn in self.warnings:
                print(f"  {YELLOW}⚠{RESET} {warn}")
        
        if not self.errors and not self.warnings:
            print(f"{GREEN}✓ All checks passed!{RESET}")
        
        print(f"{BLUE}{'='*60}{RESET}\n")


def main():
    """Hauptfunktion"""
    os.chdir(PROJECT_ROOT)
    
    checker = ErrorPatternChecker()
    success = checker.run_all_checks()
    
    if not success:
        log("ERROR", "Pre-push validation FAILED. Fix errors before pushing.")
        sys.exit(1)
    else:
        log("OK", "Pre-push validation PASSED. Safe to push!")
        sys.exit(0)


if __name__ == "__main__":
    main()
