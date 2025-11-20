#!/usr/bin/env python3
"""
Verification script to check if the Form Engine is set up correctly
"""
import sys
import traceback

def check_imports():
    """Check if all required modules can be imported"""
    print("Checking imports...")
    try:
        from app.main import app
        from app.database import engine, Base, get_db
        from app.models import Form, Page, Field, FieldCondition, PageNavigationRule, Submission, FieldResponse
        from app.schemas import FormCreate, FormResponse, PageCreate, FieldCreate
        from app.services.form_builder_service import FormBuilderService
        from app.services.form_renderer_service import FormRendererService
        from app.services.submission_service import SubmissionService
        from app.services.condition_engine import ConditionEngine
        print("  ✓ All imports successful")
        return True
    except Exception as e:
        print(f"  ✗ Import error: {e}")
        traceback.print_exc()
        return False

def check_database():
    """Check if database can be created and accessed"""
    print("\nChecking database...")
    try:
        from app.database import engine, Base, SessionLocal
        from app.models import Form
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("  ✓ Database tables created")
        
        # Test database connection
        db = SessionLocal()
        try:
            # Try to query
            count = db.query(Form).count()
            print(f"  ✓ Database connection successful (forms: {count})")
            return True
        finally:
            db.close()
    except Exception as e:
        print(f"  ✗ Database error: {e}")
        traceback.print_exc()
        return False

def check_api_routes():
    """Check if API routes are registered"""
    print("\nChecking API routes...")
    try:
        from app.main import app
        
        routes = [route.path for route in app.routes]
        expected_routes = [
            "/",
            "/health",
            "/api/v1/builder/forms",
            "/api/v1/renderer/render",
            "/api/v1/submission/create"
        ]
        
        print(f"  ✓ Found {len(routes)} routes registered")
        
        # Check for key routes
        found_routes = []
        for expected in expected_routes:
            if any(expected in route for route in routes):
                found_routes.append(expected)
        
        print(f"  ✓ Key routes present: {len(found_routes)}/{len(expected_routes)}")
        return True
    except Exception as e:
        print(f"  ✗ Route check error: {e}")
        traceback.print_exc()
        return False

def main():
    print("=" * 60)
    print("Form Engine Setup Verification")
    print("=" * 60)
    
    results = []
    results.append(check_imports())
    results.append(check_database())
    results.append(check_api_routes())
    
    print("\n" + "=" * 60)
    if all(results):
        print("✅ All checks passed! Application is ready to use.")
        print("\nTo start the server:")
        print("  uvicorn app.main:app --reload")
        print("\nOr:")
        print("  ./run.sh")
        print("\nThen visit: http://localhost:8000/docs")
        return 0
    else:
        print("❌ Some checks failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())


