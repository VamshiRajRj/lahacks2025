from uagents import Agent, Context
from typing import Dict
from model import BillAnalysisResponse
from config import ASI1_API_KEY
from uagents.setup import fund_agent_if_low
import requests
import json

my_third_agent = Agent(
    name = 'My Third Agent',
    port = 8002,
    endpoint = ['http://localhost:8002/submit']
)

agent2_responses :  Dict[str, BillAnalysisResponse] = {}

SYSTEM_MESSAGE = """
You are an expert bill splitting assistant.
You are given:

- **Itemized data from a bill** (a list of item names and their prices).
- **People or groups** who need to split the bill.
- **Special splitting conditions**, such as certain items assigned only to specific individuals.

Your task is to **create a fully structured JSON object** matching the following TypeScript types:

export type PersonType = {
id: number;
name: string;
email: string;
}

export type TransactionItemType = {
name: string;
price: number;
}

export type TransactionType = {
id: number;
splitId: number;
title: string;
transactionType: "SHOPPING" | "GROCERY" | "DINING" | "ENTERTAINMENT" | "OTHER";
items: TransactionItemType[];
splits: {
person: PersonType;
amount: number;
}[];
billAmount: number;
paidBy: { person: PersonType; amount: number }[];
date: string; // ISO format (e.g., "2025-04-27")
billLink?: string;
}

### Output Requirements:

- Output a **single valid JSON object** matching the `TransactionType` format.
- Calculate `billAmount` by summing all item prices.
- Split amounts among people based on the given conditions.
- List who paid in the `paidBy` field.
- Use today's date if no date is given.
- If `transactionType` is not specified, default to `"DINING"`.
- If no `billLink` is given, omit it from the output.
- Ensure that the total of all `splits` matches `billAmount`.
- Do not add any explanation or commentary — only output the JSON object.

---

### Example Input:

**Itemized Bill:**

- "Burger" - $10
- "Pizza" - $15
- "Coke" - $5
- "Beer" - $7

**People:**

- `{ id: 1, name: "Alice", email: "alice@example.com" }`
- `{ id: 2, name: "Bob", email: "bob@example.com" }`

**Conditions:**

- "Beer" only drank by Bob.
- All other food split evenly between Alice and Bob.

**Bill Payer:**

- Bob paid the entire bill.

Example Output:
{
"id": 101,
"splitId": 501,
"title": "Dinner at Joe's",
"transactionType": "DINING",
"items": [
{ "name": "Burger", "price": 10 },
{ "name": "Pizza", "price": 15 },
{ "name": "Coke", "price": 5 },
{ "name": "Beer", "price": 7 }
],
"splits": [
{ "person": { "id": 1, "name": "Alice", "email": "[alice@example.com](mailto:alice@example.com)" }, "amount": 15 },
{ "person": { "id": 2, "name": "Bob", "email": "[bob@example.com](mailto:bob@example.com)" }, "amount": 22 }
],
"billAmount": 37,
"paidBy": [
{ "person": { "id": 2, "name": "Bob", "email": "[bob@example.com](mailto:bob@example.com)" }, "amount": 37 }
],
"date": "2025-04-27"
}

"""

fund_agent_if_low(my_third_agent.wallet.address())

def extract_asi1_content(response_json):
    try:
        return response_json["choices"][0]["message"]["content"]
    except Exception as e:
        return f"ASI1 LLM failed to extract result: {e}"

async def call_asi1(bill_items, rules_text):
    prompt = f"""
    Bill Items:
    {chr(10).join(f'- {item.name}: ${item.price} x {item.quantity} = ${item.total}' for item in bill_items)}

    Splitting Rules:
    {rules_text}

    Create a mapping of who should pay for what items, considering:
    1. Items that should be split equally
    2. Items assigned to specific people
    3. Special cases or conditions

    Format the response as a JSON object mapping people to their items.
    """
    headers = {
        "Authorization": f"Bearer {ASI1_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "asi1-mini",
        "messages": [{"role": "system", "content": SYSTEM_MESSAGE},{"role": "user", "content": prompt}],
        "temperature": 0.0,
        "stream": False
    }
    try:
        response = requests.post("https://api.asi1.ai/v1/chat/completions", headers=headers, json=data)
        result = extract_asi1_content(response.json()) if response.status_code == 200 else f"ASI1 error: {response.text}"
    except Exception as e:
        result = f"ASI1 request failed: {e}"
    return result

@my_third_agent.on_event('startup')
async def startup_handler(ctx : Context):
    agent2_responses = ctx.storage.get("agent2_responses") or {}
    print(agent2_responses)
    ctx.logger.info(f'My name is {ctx.agent.name} and my address  is {ctx.agent.address}')


@my_third_agent.on_message(model = BillAnalysisResponse)
async def message_handler(ctx: Context, sender : str, msg: BillAnalysisResponse):
    print(f"Received message from {sender}: {msg}")
    call_asi1_response = await call_asi1(msg.items, "Split the bill fairly among charlie, bob and dave. Charlie is a vegetarian only. ")
    with open('output.json', 'w') as f:
        json.dump(call_asi1_response, f, indent=2)



if __name__ == "__main__":
    my_third_agent.run()