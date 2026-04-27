from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
APP_DIR = ROOT / "app"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from gasgx_matrix.streamlit_app import run


if __name__ == "__main__":
    run()
