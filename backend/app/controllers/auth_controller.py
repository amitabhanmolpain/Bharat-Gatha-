from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, set_access_cookies, set_refresh_cookies, unset_jwt_cookies
import re
from app.models.user import UserModel
import os

auth_bp = Blueprint('auth', __name__)

def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "avatar": user.get("avatar"),
        "role": user.get("role"),
        "level": user.get("level"),
        "xp": user.get("xp"),
        "gamesPlayed": user.get("gamesPlayed"),
        "gamesWon": user.get("gamesWon"),
        "highestScore": user.get("highestScore"),
        "createdAt": user.get("createdAt").isoformat() if user.get("createdAt") else None
    }

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not name.strip():
        return jsonify({"message": "Name is required"}), 400
    if not email or not is_valid_email(email):
        return jsonify({"message": "Invalid email address"}), 400
    if not password or len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    existing_user = UserModel.find_by_email(email)
    if existing_user:
        return jsonify({"message": "Email already in use"}), 409

    try:
        new_user = UserModel.create_user(name=name, email=email, password=password)
        
        # generate tokens
        access_token = create_access_token(identity=str(new_user["_id"]))
        refresh_token = create_refresh_token(identity=str(new_user["_id"]))
        
        resp = jsonify({
            "message": "User created successfully",
            "user": serialize_user(new_user),
            "access_token": access_token
        })
        
        set_access_cookies(resp, access_token)
        set_refresh_cookies(resp, refresh_token)
        return resp, 201
    except Exception as e:
        return jsonify({"message": str(e) if str(e) == "Database unavailable" else "Internal error"}), 503 if str(e) == "Database unavailable" else 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    try:
        user = UserModel.find_by_email(email)
        if not user or not UserModel.verify_password(password, user.get("passwordHash")):
            return jsonify({"message": "Invalid email or password"}), 401

        access_token = create_access_token(identity=str(user["_id"]))
        refresh_token = create_refresh_token(identity=str(user["_id"]))
        
        resp = jsonify({
            "message": "Login successful",
            "user": serialize_user(user),
            "access_token": access_token
        })
        set_access_cookies(resp, access_token)
        set_refresh_cookies(resp, refresh_token)
        return resp, 200
    except Exception as e:
        return jsonify({"message": str(e) if str(e) == "Database unavailable" else "Internal error"}), 503 if str(e) == "Database unavailable" else 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    try:
        current_user_id = get_jwt_identity()
        user = UserModel.find_by_id(current_user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
            
        return jsonify({
            "user": serialize_user(user)
        }), 200
    except Exception as e:
        return jsonify({"message": str(e) if str(e) == "Database unavailable" else "Internal error"}), 503 if str(e) == "Database unavailable" else 500

@auth_bp.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "Authentication service is running"}), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    
    resp = jsonify({
        "message": "Token refreshed successfully",
        "access_token": access_token
    })
    set_access_cookies(resp, access_token)
    return resp, 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    resp = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(resp)
    return resp, 200

import urllib.request
import urllib.parse
import json

@auth_bp.route('/google', methods=['GET'])
def google_auth():
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
    
    if not client_id or not redirect_uri:
        return jsonify({"message": "Google OAuth is not configured on the server."}), 500
        
    scope = "openid email profile"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={urllib.parse.quote(client_id)}&"
        f"redirect_uri={urllib.parse.quote(redirect_uri)}&"
        f"response_type=code&"
        f"scope={urllib.parse.quote(scope)}&"
        f"access_type=offline&"
        f"prompt=consent"
    )
    from flask import redirect
    return redirect(auth_url)

@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"message": "No authorization code provided"}), 400
        
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
    
    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri
    }).encode("utf-8")
    
    try:
        req = urllib.request.Request(token_url, data=data, method="POST")
        with urllib.request.urlopen(req) as response:
            token_response = json.loads(response.read().decode())
    except Exception as e:
        return jsonify({"message": "Failed to exchange authorization code", "error": str(e)}), 500
        
    access_token = token_response.get("access_token")
    if not access_token:
        return jsonify({"message": "No access token received from Google"}), 500
        
    # Get user info
    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    req = urllib.request.Request(userinfo_url, headers={"Authorization": f"Bearer {access_token}"})
    try:
        with urllib.request.urlopen(req) as response:
            user_info = json.loads(response.read().decode())
    except Exception as e:
        return jsonify({"message": "Failed to fetch user info", "error": str(e)}), 500
        
    email = user_info.get("email")
    name = user_info.get("name")
    google_id = user_info.get("id")
    picture = user_info.get("picture")
    
    if not email:
        return jsonify({"message": "Google did not return an email address"}), 400
        
    # Find or create user
    user = UserModel.find_by_email(email)
    if not user:
        user = UserModel.create_user(name=name, email=email, password=None)
        
    # Update google ID and avatar if not present
    updates = {}
    if not user.get("googleId"):
        updates["googleId"] = google_id
    if not user.get("avatar") and picture:
        updates["avatar"] = picture
        
    if updates:
        UserModel.get_collection().update_one({"_id": user["_id"]}, {"$set": updates})
        
    jwt_token = create_access_token(identity=str(user["_id"]))
    refresh_token = create_refresh_token(identity=str(user["_id"]))
    
    frontend_url = "http://localhost:3000" # Let frontend root handle token routing
    from flask import redirect
    
    resp = redirect(f"{frontend_url}/#token={jwt_token}")
    set_access_cookies(resp, jwt_token)
    set_refresh_cookies(resp, refresh_token)
    return resp
