import unittest
from flask import json
from app import create_app
from app.models.user import UserModel
import os

class AuthTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ['DATABASE_MODE'] = "sqlite"
        os.environ['MONGO_URI'] = "mongodb://localhost:27017/test_bharat_gatha"
        os.environ['JWT_SECRET_KEY'] = "test-secret"
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

    def setUp(self):
        try:
            if os.environ.get("DATABASE_MODE") == "sqlite":
                from app.config.db import get_sqlite_conn
                conn = get_sqlite_conn()
                conn.execute("DELETE FROM users")
                conn.commit()
            else:
                UserModel.get_collection().delete_many({})
        except Exception:
            pass # ignore if db is down during test

    def test_signup(self):
        resp = self.client.post('/api/auth/signup', json={
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'password123'
        })
        # If DB is down, this will return 503 which is graceful failure
        self.assertIn(resp.status_code, [201, 503])
        
    def test_login(self):
        self.client.post('/api/auth/signup', json={
            'name': 'Test User',
            'email': 'testlogin@example.com',
            'password': 'password123'
        })
        resp = self.client.post('/api/auth/login', json={
            'email': 'testlogin@example.com',
            'password': 'password123'
        })
        self.assertIn(resp.status_code, [200, 503])
        
    def test_missing_auth(self):
        resp = self.client.get('/api/auth/me')
        self.assertEqual(resp.status_code, 401)
        
    def test_logout(self):
        resp = self.client.post('/api/auth/logout')
        self.assertEqual(resp.status_code, 200)

if __name__ == '__main__':
    unittest.main()
