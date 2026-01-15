from backend.database import SessionLocal, engine
from backend import models, auth

# Create tables
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if admin exists
existing_admin = db.query(models.Account).filter(models.Account.email == "admin@trustshield.com").first()
if not existing_admin:
    print("Creating Admin user...")
    admin_user = models.Account(
        email="admin@trustshield.com",
        hashed_password=auth.get_password_hash("admin123"),
        full_name="System Admin",
        role="ADMIN"
    )
    db.add(admin_user)
else:
    print("Admin user already exists.")

# Check if regular user exists
existing_user = db.query(models.Account).filter(models.Account.email == "user@trustshield.com").first()
if not existing_user:
    print("Creating Regular user...")
    regular_user = models.Account(
        email="user@trustshield.com",
        hashed_password=auth.get_password_hash("user123"),
        full_name="Risk Analyst",
        role="USER"
    )
    db.add(regular_user)
else:
    print("Regular user already exists.")

db.commit()
db.close()
print("Auth DB initialization complete.")
