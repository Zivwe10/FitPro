#!/usr/bin/env python
"""Entry point for running the Flask application."""
import os
from app import create_app

if __name__ == "__main__":
    app = create_app()
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    app.run(debug=debug, host=host, port=port)
