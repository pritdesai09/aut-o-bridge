from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(15), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    language = Column(String(5), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    children = relationship("Child", back_populates="parent")

class Child(Base):
    __tablename__ = "children"
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(String(20), nullable=False)
    gender = Column(String(10), nullable=False)
    photo_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    parent = relationship("User", back_populates="children")
    reports = relationship("DiagnosticReport", back_populates="child")
    doctor_accesses = relationship("DoctorAccess", back_populates="child")

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    languages = Column(String(100), nullable=False)
    rating = Column(Float, default=5.0)
    experience_years = Column(Integer, default=1)
    fee = Column(Integer, default=500)
    available_modes = Column(String(50), nullable=False)
    location = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    photo = Column(String(10), nullable=True)
    appointments = relationship("Appointment", back_populates="doctor")

class DiagnosticReport(Base):
    __tablename__ = "diagnostic_reports"
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    questionnaire_score = Column(Float, nullable=True)
    emotion_alignment_score = Column(Float, nullable=True)
    emotion_variability_score = Column(Float, nullable=True)
    final_confidence = Column(Float, nullable=True)
    confidence_level = Column(String(20), nullable=True)
    category_scores = Column(Text, nullable=True)
    emotion_timeline = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    child = relationship("Child", back_populates="reports")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    parent_id = Column(Integer, ForeignKey("users.id"))
    mode = Column(String(20), nullable=False)
    appointment_date = Column(String(20), nullable=False)
    appointment_time = Column(String(10), nullable=False)
    status = Column(String(20), default="upcoming")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    doctor = relationship("Doctor", back_populates="appointments")

class DoctorAccess(Base):
    __tablename__ = "doctor_access"
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    child = relationship("Child", back_populates="doctor_accesses")