import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, DateTime, ForeignKey, Text, Enum, JSON, Integer, Uuid
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    enforcement_officer = "enforcement_officer"
    admin = "admin"


class FieldType(str, enum.Enum):
    mrp = "mrp"
    net_qty = "net_qty"
    mfg_date = "mfg_date"
    manufacturer = "manufacturer"
    consumer_care = "consumer_care"


class ComplianceStatus(str, enum.Enum):
    passed = "pass"
    failed = "fail"
    not_found = "not_found"
    insufficient_data = "insufficient_data"


class OverallStatus(str, enum.Enum):
    compliant = "compliant"
    non_compliant = "non_compliant"
    partial = "partial"


# ─── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.enforcement_officer)
    district = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    scans = relationship("Scan", back_populates="user")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    image_path = Column(String(512), nullable=False)
    product_name = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    overall_status = Column(Enum(OverallStatus), nullable=True)
    compliance_score = Column(Float, nullable=True)
    district = Column(String(255), nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    package_area_cm2 = Column(Float, nullable=True)

    user = relationship("User", back_populates="scans")
    extracted_fields = relationship("ExtractedField", back_populates="scan", cascade="all, delete-orphan")
    compliance_checks = relationship("ComplianceCheck", back_populates="scan", cascade="all, delete-orphan")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(Uuid(as_uuid=True), ForeignKey("scans.id"), nullable=False)
    field_type = Column(Enum(FieldType), nullable=False)
    raw_text = Column(Text, nullable=True)
    parsed_value = Column(Text, nullable=True)
    bounding_box_json = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)

    scan = relationship("Scan", back_populates="extracted_fields")


class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(Uuid(as_uuid=True), ForeignKey("scans.id"), nullable=False)
    rule_clause_id = Column(Integer, ForeignKey("rule_clauses.id"), nullable=True)
    rule_clause_text = Column(Text, nullable=True)
    field_type = Column(String(50), nullable=True)
    status = Column(Enum(ComplianceStatus), nullable=False)
    violation_reason = Column(Text, nullable=True)

    scan = relationship("Scan", back_populates="compliance_checks")
    rule_clause = relationship("RuleClause")


class RuleClause(Base):
    __tablename__ = "rule_clauses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    clause_number = Column(String(50), nullable=False, unique=True)
    clause_text = Column(Text, nullable=False)
    field_type = Column(String(50), nullable=False)
    validation_type = Column(String(100), nullable=False)
    validation_params_json = Column(JSON, nullable=True)
