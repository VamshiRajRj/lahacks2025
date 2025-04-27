from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional


# Pydantic Models
class PersonSchema(BaseModel):
    id: int
    name: str
    email: str


class TransactionItemSchema(BaseModel):
    name: str
    price: float


class TransactionSplitSchema(BaseModel):
    person: PersonSchema
    amount: float


class TransactionPaidBySchema(BaseModel):
    person: PersonSchema
    amount: float


class TransactionSchema(BaseModel):
    splitId: int = Field(..., alias="split_id")
    title: str
    transactionType: str = Field(..., alias="transaction_type")
    items: List[TransactionItemSchema]
    splits: List[TransactionSplitSchema]
    billAmount: float = Field(..., alias="bill_amount")
    paidBy: List[TransactionPaidBySchema] = Field(..., alias="paid_by")
    date: str
    billLink: Optional[str] = Field(None, alias="bill_link")

    class Config:
        populate_by_name = True


db = SQLAlchemy()


class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
        }


# Split -> related to People (Many to Many)
split_people = db.Table(
    "split_people",
    db.Column("split_id", db.Integer, db.ForeignKey("split.id")),
    db.Column("person_id", db.Integer, db.ForeignKey("person.id")),
)


class Split(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    people = db.relationship("Person", secondary=split_people, backref="splits")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "people": [person.to_dict() for person in self.people],
        }


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    split_id = db.Column(db.Integer, db.ForeignKey("split.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)
    bill_amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(20), nullable=False)
    bill_link = db.Column(db.String(500), nullable=True)

    # Relationship to Split
    split = db.relationship("Split", backref=db.backref("transactions", lazy=True))

    # Relationship to TransactionItem and SplitPersonAmount
    items = db.relationship(
        "TransactionItem", backref="transaction", cascade="all, delete-orphan"
    )
    splits = db.relationship(
        "TransactionSplit", backref="transaction", cascade="all, delete-orphan"
    )
    paid_by = db.relationship(
        "TransactionPaidBy", backref="transaction", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "splitId": self.split_id,
            "title": self.title,
            "transactionType": self.transaction_type,
            "billAmount": self.bill_amount,
            "date": self.date,
            "billLink": self.bill_link,
            "items": [item.to_dict() for item in self.items],
            "splits": [split.to_dict() for split in self.splits],
            "paidBy": [payer.to_dict() for payer in self.paid_by],
        }


class TransactionItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(
        db.Integer, db.ForeignKey("transaction.id"), nullable=False
    )
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "name": self.name,
            "price": self.price,
        }


class TransactionSplit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(
        db.Integer, db.ForeignKey("transaction.id"), nullable=False
    )
    person_id = db.Column(db.Integer, db.ForeignKey("person.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)

    person = db.relationship("Person")

    def to_dict(self):
        return {
            "person": self.person.to_dict(),
            "amount": self.amount,
        }


class TransactionPaidBy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(
        db.Integer, db.ForeignKey("transaction.id"), nullable=False
    )
    person_id = db.Column(db.Integer, db.ForeignKey("person.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)

    person = db.relationship("Person")

    def to_dict(self):
        return {
            "person": self.person.to_dict(),
            "amount": self.amount,
        }
