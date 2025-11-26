"""
Preflight script: runs schema checks and ensures sequence tables exist before starting the app or running tests.
"""
import subprocess
import sys
import os
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS_DIR = os.path.join(ROOT_DIR, 'tools')

CHECK_SCRIPT = os.path.join(TOOLS_DIR, 'check_schema.py')
CREATE_SEQ_SCRIPT = os.path.join(TOOLS_DIR, 'create_seq_table.py')
SEED_SCRIPT = os.path.join(TOOLS_DIR, 'seed_db.py')

def run(script_path):
    print(f"Running {os.path.basename(script_path)}...")
    try:
        res = subprocess.call([sys.executable, script_path])
        if res != 0:
            print(f"Script {os.path.basename(script_path)} returned exit code {res}")
            return False
        return True
    except Exception as e:
        print(f"Failed to run {script_path}: {e}")
        return False


def main(seed=False):
    ok = True
    ok &= run(CHECK_SCRIPT)
    ok &= run(CREATE_SEQ_SCRIPT)
    if seed:
        ok &= run(SEED_SCRIPT)
    if ok:
        print("Preflight checks completed successfully")
    else:
        print("Preflight checks found issues. Please review the output above.")

if __name__ == '__main__':
    # allow passing --seed to also run seed script
    seed = '--seed' in sys.argv
    main(seed=seed)
