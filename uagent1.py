from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
import uuid
import requests
import json
from datetime import datetime
from model import BillAnalysisRequest, BillAnalysisResponse, BillItem
from typing import Dict
import re

















from config import ASI1_API_KEY

SYSTEM_MESSAGE = """
You are the central decision-maker for a multi-agent billing system.

You have perfect knowledge of two specialized Agents:

1. Agent 1 (agent_id = agent_1)
   - Expected Input Model: BillAnalysisRequest
     - Fields: {image_url: str; text_data: str; request_id: str; timestamp: datetime}
   - Specialization: Takes an image of a bill (or optional text) and extracts structured, itemized bill data.

2. Agent 2 (agent_id = agent_2)
   - Expected Input Model: BillAnalysisResponse
     - Fields: {request_id: str; items: List[BillItem]; total_amount: float; currency: str; timestamp: datetime; status: str; error: Optional[str]; metadata: Dict}
   - Specialization: Takes structured, itemized bill data and splits it among users/groups based on instructions.
   - class BillItem(Model):
        name: str
        price: float
        quantity: int
        total: float

---

Your Tasks:

- **If the input contains an `image_url`,** choose **Agent 1** (`agent_1`) and format the input according to the `BillAnalysisRequest` model.
- **If the input contains structured bill data (textual breakdown, itemized items with prices, people names, splitting instructions),** choose **Agent 2** (`agent_2`) and format the input according to the `BillAnalysisResponse` model.

Make sure to always match the input exactly to the required model fields.

Return output strictly in the following format:

{"agent" : "agent_1","input_format" : {"image_url": "https://c8.alamy.com/comp/FWREE7/miami-floridael-chalan-restaurant-peruvian-foodcheck-receipt-bill-FWREE7.jpg", "text_data": "", "request_id": "a3e3c314-d82d-47b3-8fdb-565a388ec26a", "timestamp": "2025-04-27T06:30:23.036716"}}

Don't wrap in  ```json ```
Only return `agent_1` or `agent_2` — no extra explanations.

---

Notes:
- If image input is detected (e.g., a URL to a Google Drive or any image hosting), assume Agent 1.
- If text describes people, prices, items, or splitting a bill, assume Agent 2.
- Ensure correct data field population even if some fields are empty or inferred (e.g., metadata can be partial).
"""


my_first_agent = Agent(
    name = 'My First Agent',
    port = 5050,
    endpoint = ['http://localhost:5050/submit']
)

fund_agent_if_low(my_first_agent.wallet.address())

AGENTS = [
    {"agent_1" : "agent1qffqrx4a3dad4hyyujn5vqkksdgxpdsqhgxlj99d4emczyh99dxds94759l",
    "agent_2" : "agent1q2z65mc7m6gw769ydd89slu400kxyucx2c4jda5n2daq596rhg6d242qpjz"},
]


def extract_asi1_content(response_json):
    try:
        return response_json["choices"][0]["message"]["content"]
    except Exception as e:
        return f"ASI1 LLM failed to extract result: {e}"

async def get_agent_address(input):
    #CALL ASI1 mini to get the relevant agent based on the workflow state
    prompt = f"Input : {input} Please tell me which agent to call based on the workflow state."
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

def parse_raw_to_bill_analysis_request(raw_text: str) -> BillAnalysisRequest:
    # Parse fields manually
    fields = {}
    
    # Match key=value pairs (handles quoted strings and datetime)
    pattern = r"(\w+)=('.*?'|datetime\.datetime\([^)]+\))"
    matches = re.findall(pattern, raw_text)

    for key, value in matches:
        if value.startswith("'") and value.endswith("'"):
            fields[key] = value.strip("'")
        elif value.startswith("datetime.datetime"):
            # Extract the datetime numbers
            numbers = re.findall(r"\d+", value)
            numbers = list(map(int, numbers))
            fields[key] = datetime(*numbers)
    
    # Create BillAnalysisRequest object
    return 

async def call_relevant_agent(ctx, input):
    # This function will be called to determine which agent to call based on the workflow state
    # For now, we will just return the second agent
    print(f"Calling relevant agent with input: {input}")
    llm_response = await get_agent_address(input)
    print(llm_response)
    parsed = json.loads(llm_response.replace("```json", "").replace("```", "").strip())
    agent_id = parsed["agent"]
    input_format = parsed["input_format"]
    print(f"Agent ID :  {agent_id}")
    print(f"Input Foramt ID :  {input_format}")
    if agent_id == "agent_1":
        await ctx.send(AGENTS[0][agent_id], BillAnalysisRequest(
        image_url=input_format.get("image_url", ""),
        text_data=input_format.get("text_data", ""),
        request_id=input_format.get("request_id", ""),
        timestamp=input_format.get("timestamp", datetime.now())
    ))
    else:
        await ctx.send(AGENTS[0][agent_id], BillAnalysisResponse(request_id = input_format.get("request_id", ""),
    items= [BillItem(name= val.get("name", ""),
    price= val.get("price", 0.0),
    quantity= val.get("quantity", 0),
    total=val.get("total", 0.0)
    ) for val in input_format.get("items", [])],
    total_amount= input_format.get("total_amount", 0.0),
    currency = input_format.get("currency", "USD"),
    timestamp= input_format.get("timestamp", datetime.now()),
    status= input_format.get("status", "completed"),
    error= input_format.get("error", ""),
    metadata = input_format.get("metadata", {})))

@my_first_agent.on_event('startup')
async def startup_handler(ctx : Context):
    # billRequest = BillAnalysisRequest(
    #     image_url="https://c8.alamy.com/comp/FWREE7/miami-floridael-chalan-restaurant-peruvian-foodcheck-receipt-bill-FWREE7.jpg",
    #     text_data="",
    #     request_id=str(uuid.uuid4()),
    #     timestamp=datetime.now()
    # )
    billRequest = "Vamshi and Prashanth went out to eat pizza, 20$. Vamshi Paid the bill"
    #Call second_agent 
    await call_relevant_agent(ctx, billRequest)
    


@my_first_agent.on_message(model = BillAnalysisResponse)
async def message_handler(ctx: Context, sender : str, msg: BillAnalysisResponse):
    #Call third_agent
    await call_relevant_agent(ctx, msg)


if __name__ == "__main__":
    my_first_agent.run()