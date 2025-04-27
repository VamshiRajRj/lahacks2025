from uagents import Model
from datetime import datetime
from typing import Dict, Optional, List


# Define your models
class RequestA(Model):
    text: str

class RequestB(Model):
    image_url: str
    text: str

class Response(Model):
    body: str
    agent_address: str
    time: str


class BillItem(Model):
    name: str
    price: float
    quantity: int
    total: float

class BillAnalysisResponse(Model):
    request_id: str
    items: List[BillItem]
    total_amount: float
    currency: str
    timestamp: datetime
    status: str
    error: Optional[str]
    metadata: Dict


# Data model (envolope) which you want to send from one agent to another
class BillAnalysisRequest(Model):
    image_url: str
    text_data: str
    request_id: str
    timestamp: datetime
