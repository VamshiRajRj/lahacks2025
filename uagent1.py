from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
import uuid

from datetime import datetime
from model import BillAnalysisRequest, BillAnalysisResponse
from typing import Dict




my_first_agent = Agent(
    name = 'My First Agent',
    port = 5050,
    endpoint = ['http://localhost:5050/submit']
)

fund_agent_if_low(my_first_agent.wallet.address())

second_agent = "agent1qffqrx4a3dad4hyyujn5vqkksdgxpdsqhgxlj99d4emczyh99dxds94759l"
third_agent = "agent1q2z65mc7m6gw769ydd89slu400kxyucx2c4jda5n2daq596rhg6d242qpjz"


# Store workflow states
workflow_states: Dict[str, Dict] = {}


@my_first_agent.on_event('startup')
async def startup_handler(ctx : Context):
    billRequest = BillAnalysisRequest(
        image_url="https://c8.alamy.com/comp/FWREE7/miami-floridael-chalan-restaurant-peruvian-foodcheck-receipt-bill-FWREE7.jpg",
        text_data="",
        request_id=str(uuid.uuid4()),
        timestamp=datetime.now()
    )
    await ctx.send(second_agent, billRequest)


@my_first_agent.on_message(model = BillAnalysisResponse)
async def message_handler(ctx: Context, sender : str, msg: BillAnalysisResponse):
    await ctx.send(third_agent, msg)

if __name__ == "__main__":
    my_first_agent.run()