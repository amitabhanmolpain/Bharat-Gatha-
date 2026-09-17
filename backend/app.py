"""Main application entry point re-exporting create_app from the app package."""

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
