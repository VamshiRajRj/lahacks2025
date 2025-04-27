from app import db, app
from models import (
    Person,
    Split,
    Transaction,
    TransactionItem,
    TransactionSplit,
    TransactionPaidBy,
)
from datetime import datetime

with app.app_context():
    db.drop_all()
    db.create_all()

    # Create Users
    user1 = Person(id=1, name="Alice", email="alice@example.com")
    user2 = Person(id=2, name="Bob", email="bob@example.com")
    user3 = Person(id=3, name="Charlie", email="charlie@example.com")
    user4 = Person(id=4, name="Diana", email="diana@example.com")
    user5 = Person(
        id=5, name="John Doe", email="johndoe@example.com"
    )  # mockCurrentUser

    db.session.add_all([user1, user2, user3, user4, user5])
    db.session.commit()

    # Create Splits
    split1 = Split(
        id=1,
        name="Groceries",
        people=[user1, user2, user5],
    )
    split2 = Split(
        id=2,
        name="Coffee Run",
        people=[user3, user4, user5],
    )
    split3 = Split(
        id=3,
        name="Utilities",
        people=[user1, user3, user5],
    )
    split4 = Split(
        id=4,
        name="Dinner Out",
        people=[user2, user1, user3, user4, user5],
    )
    split5 = Split(
        id=5,
        name="Movie Night",
        people=[user2, user5],
    )

    db.session.add_all([split1, split2, split3, split4, split5])
    db.session.commit()

    # Create Transactions (Items + Splits + PaidBy separately)
    tx1 = Transaction(
        id=1,
        split_id=1,
        title="Walmart",
        transaction_type="GROCERY",
        bill_amount=150.75,
        date="2023-10-01",
    )
    db.session.add(tx1)
    db.session.flush()

    items1 = [
        TransactionItem(transaction_id=tx1.id, name="Milk", price=3.5),
        TransactionItem(transaction_id=tx1.id, name="Bread", price=2.0),
        TransactionItem(transaction_id=tx1.id, name="Eggs", price=4.0),
    ]
    splits1 = [
        TransactionSplit(transaction_id=tx1.id, person_id=user1.id, amount=50.25),
        TransactionSplit(transaction_id=tx1.id, person_id=user2.id, amount=50.25),
        TransactionSplit(transaction_id=tx1.id, person_id=user5.id, amount=50.25),
    ]
    paidby1 = [
        TransactionPaidBy(transaction_id=tx1.id, person_id=user1.id, amount=150.75),
    ]

    db.session.add_all(items1 + splits1 + paidby1)

    # --- tx2 ---
    tx2 = Transaction(
        id=2,
        split_id=2,
        title="Starbucks",
        transaction_type="DINING",
        bill_amount=25.5,
        date="2023-10-03",
    )
    db.session.add(tx2)
    db.session.flush()

    items2 = [
        TransactionItem(transaction_id=tx2.id, name="Latte", price=5.5),
        TransactionItem(transaction_id=tx2.id, name="Croissant", price=3.0),
    ]
    splits2 = [
        TransactionSplit(transaction_id=tx2.id, person_id=user3.id, amount=8.5),
        TransactionSplit(transaction_id=tx2.id, person_id=user4.id, amount=8.5),
        TransactionSplit(transaction_id=tx2.id, person_id=user5.id, amount=8.5),
    ]
    paidby2 = [
        TransactionPaidBy(transaction_id=tx2.id, person_id=user3.id, amount=25.5),
    ]

    db.session.add_all(items2 + splits2 + paidby2)

    # --- tx3 ---
    tx3 = Transaction(
        id=3,
        split_id=3,
        title="Utility Company",
        transaction_type="OTHER",
        bill_amount=200.0,
        date="2023-10-05",
    )
    db.session.add(tx3)
    db.session.flush()

    items3 = [
        TransactionItem(transaction_id=tx3.id, name="Electricity Bill", price=200.0),
    ]
    splits3 = [
        TransactionSplit(transaction_id=tx3.id, person_id=user1.id, amount=66.67),
        TransactionSplit(transaction_id=tx3.id, person_id=user3.id, amount=66.67),
        TransactionSplit(transaction_id=tx3.id, person_id=user5.id, amount=66.67),
    ]
    paidby3 = [
        TransactionPaidBy(transaction_id=tx3.id, person_id=user1.id, amount=200.0),
    ]

    db.session.add_all(items3 + splits3 + paidby3)

    db.session.commit()

    print("✅ Database seeded successfully!")
