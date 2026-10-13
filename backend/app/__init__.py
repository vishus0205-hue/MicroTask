from flask import Flask, jsonify
from flask_cors import CORS
from app.models.db import init_app_db

def create_app(config_class="config.Config"):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize SQLite database
    init_app_db(app)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}}, supports_credentials=True)

    # Health check route
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "service": "Micro-Task Management System API",
            "version": "1.0.0"
        }), 200

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.tasks import tasks_bp
    from app.routes.defects import defects_bp
    from app.routes.notifications import notifications_bp
    from app.routes.metrics import metrics_bp
    from app.routes.reports import reports_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(defects_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(metrics_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(admin_bp)

    # Centralized JSON error handling
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "details": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized access", "details": str(e)}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Access forbidden", "details": str(e)}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Requested resource not found"}), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({"error": "Internal server error occurred", "details": str(e)}), 500

    return app
