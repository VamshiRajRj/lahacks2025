from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import base64
from models import (
    db,
    Person,
    Split,
    Transaction,
    TransactionItem,
    TransactionSplit,
    TransactionPaidBy,
    TransactionSchema,
)
import re
from datetime import datetime
import openai
import json

client = openai.OpenAI()


openai_llm = "gpt-4o-mini"

# --- App Setup ---
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite3"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
CORS(app, origins="*", supports_credentials=True)


# --- Utils ---
def camel_to_snake(name):
    """Convert camelCase to snake_case"""
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


# --- Create tables once ---
@app.before_request
def create_tables():
    if not hasattr(app, "db_initialized"):
        db.create_all()
        app.db_initialized = True


# --- User API ---
@app.route("/api/user", methods=["GET"])
def get_user():
    user = Person.query.first()
    if not user:
        return jsonify({"error": "No user found"}), 404
    return jsonify(user.to_dict()), 200


# --- Splits API ---
@app.route("/api/splits", methods=["GET", "POST"])
def handle_splits():
    if request.method == "GET":
        splits = Split.query.all()
        return jsonify([split.to_dict() for split in splits])

    if request.method == "POST":
        data = request.json
        split = Split(
            name=data["name"], amount=data["amount"], last_updated=datetime.utcnow()
        )

        # Attach people
        people_ids = [p["id"] for p in data.get("people", [])]
        split.people = Person.query.filter(Person.id.in_(people_ids)).all()

        db.session.add(split)
        db.session.commit()
        return jsonify(split.to_dict()), 201


@app.route("/api/splits/<int:split_id>", methods=["GET", "PUT", "DELETE"])
def modify_split(split_id):
    split = Split.query.get(split_id)
    if not split:
        return jsonify({"error": "Split not found"}), 404

    if request.method == "GET":
        return jsonify(split.to_dict()), 200

    if request.method == "PUT":
        data = request.json
        split.name = data.get("name", split.name)
        split.amount = data.get("amount", split.amount)
        split.last_updated = datetime.utcnow()

        if "people" in data:
            people_ids = [p["id"] for p in data["people"]]
            split.people = Person.query.filter(Person.id.in_(people_ids)).all()

        db.session.commit()
        return jsonify(split.to_dict()), 200

    if request.method == "DELETE":
        db.session.delete(split)
        db.session.commit()
        return jsonify({"message": "Split deleted"}), 200


# --- Transactions API ---
@app.route("/api/transactions", methods=["GET", "POST"])
def handle_transactions():
    if request.method == "GET":
        transactions = Transaction.query.all()
        return jsonify([tx.to_dict() for tx in transactions])

    if request.method == "POST":
        data = request.json
        snake_case_data = {camel_to_snake(k): v for k, v in data.items()}

        # Create Transaction
        tx = Transaction(
            split_id=snake_case_data["split_id"],
            title=snake_case_data["title"],
            transaction_type=snake_case_data["transaction_type"],
            bill_amount=snake_case_data["bill_amount"],
            date=snake_case_data["date"],
            bill_link=snake_case_data.get("bill_link"),
        )
        db.session.add(tx)
        db.session.flush()  # to get tx.id

        # Add Items
        for item in snake_case_data.get("items", []):
            tx_item = TransactionItem(
                transaction_id=tx.id, name=item["name"], price=item["price"]
            )
            db.session.add(tx_item)

        # Add Splits
        for split in snake_case_data.get("splits", []):
            tx_split = TransactionSplit(
                transaction_id=tx.id,
                person_id=split["person"]["id"],
                amount=split["amount"],
            )
            db.session.add(tx_split)

        # Add PaidBy
        for payer in snake_case_data.get("paid_by", []):
            tx_paid = TransactionPaidBy(
                transaction_id=tx.id,
                person_id=payer["person"]["id"],
                amount=payer["amount"],
            )
            db.session.add(tx_paid)

        db.session.commit()
        return jsonify(tx.to_dict()), 201


@app.route("/api/transactions/<int:tx_id>", methods=["GET", "PUT", "DELETE"])
def modify_transaction(tx_id):
    tx = Transaction.query.get(tx_id)
    if not tx:
        return jsonify({"error": "Transaction not found"}), 404

    if request.method == "GET":
        return jsonify(tx.to_dict()), 200

    if request.method == "PUT":
        data = request.json
        tx.title = data.get("title", tx.title)
        tx.transaction_type = data.get("transactionType", tx.transaction_type)
        tx.bill_amount = data.get("billAmount", tx.bill_amount)
        tx.date = data.get("date", tx.date)
        tx.bill_link = data.get("billLink", tx.bill_link)

        db.session.commit()
        return jsonify(tx.to_dict()), 200

    if request.method == "DELETE":
        db.session.delete(tx)
        db.session.commit()
        return jsonify({"message": "Transaction deleted"}), 200


@app.route("/api/chat/gpt", methods=["POST"])
def handle_chat_gpt():
    try:
        data = request.json

        # Validate required fields
        if not all(
            key in data for key in ["id", "type", "sender", "imageUrl", "message"]
        ):
            return jsonify({"error": "Missing required fields"}), 400
        print(type(data["imageUrl"]))
        print(data["imageUrl"])

        # encode to base64
        def encode_to_base64(object):
            if isinstance(object, bytes):
                return base64.b64encode(object).decode("utf-8")
            else:
                return object

        data["imageUrl"] = encode_to_base64(data["imageUrl"])
        extra_content = """
        persons = {
            1: {
                "id": 1,
                "name": "Alice",
                "email": "alice@example.com",
                "splits": [1, 3, 4],
            },
            2: {
                "id": 2,
                "name": "Bob",
                "email": "bob@example.com",
                "splits": [1, 4, 5],
            },
            3: {
                "id": 3,
                "name": "Charlie",
                "email": "charlie@example.com",
                "splits": [2, 3, 4],
            },
            4: {
                "id": 4,
                "name": "Diana",
                "email": "diana@example.com",
                "splits": [2, 4],
            },
            5: {
                "id": 5,
                "name": "John Doe",
                "email": "johndoe@example.com",
                "splits": [1, 2, 3, 4, 5],
            },
        }
        """
        messages = [
            {
                "role": "system",
                "content": f"You are a helpful assistant that extracts information from a given text and/or image into the strucutured format -in {TransactionSchema.model_json_schema()} nothing else, just json, camelcase, also give back metadata",
            },
            {
                "role": "user",
                "content": "some pre-DB data: I am Alice, if paidBy is empty just say you paid. Must say how much each person is owed (splits) field and who paid (paidBy) field"
                + extra_content,
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": "user_text:"
                        + str(data["message"])
                        + "\n"
                        + "metadata:"
                        + str(data["id"])
                        + " "
                        + str(data["type"])
                        + " "
                        + str(data["sender"]),
                    },
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_image",
                        "image_url": data["imageUrl"],
                    },
                ],
            },
        ]
        if len(data["imageUrl"]) == 0:
            data["imageUrl"] = None
        # Process the input
        response = client.responses.create(
            model=openai_llm,
            input=messages[:-1] if data["imageUrl"] is None else messages,
        )

        # Extract the content from the response
        if response and hasattr(response, "output") and response.output:
            content = (
                response.output[0]
                .content[0]
                .text.replace("```json", "")
                .replace("```", "")
            )
            print(content)
            return jsonify(json.loads(content)), 200
        else:
            return jsonify({"error": "No valid response from OpenAI"}), 500

    except Exception as e:
        print(str(e))
        return jsonify({"error": str(e)}), 500


# --- Main ---
if __name__ == "__main__":
    app.run(debug=True)
