#!/usr/bin/env python3
import json
import sys

def build_script():
    with open('/scripts/generate_complete_songs.py', 'w') as f:
        f.write("# Generator script\n")

if __name__ == '__main__':
    build_script()
