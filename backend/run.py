"""Entry point server script for running the Bharat Gatha Flask backend.

Instantiates the application via the factory function and starts the
development server listening on port 5001.
"""

from app import create_app

app = create_app()

if __name__ == '__main__':
    # Run the Flask app on port 5001 by default
    app.run(host='0.0.0.0', port=5001, debug=True)