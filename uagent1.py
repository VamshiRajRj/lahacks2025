from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
import uuid

from datetime import datetime
from model import BillAnalysisRequest, BillAnalysisResponse




my_first_agent = Agent(
    name = 'My First Agent',
    port = 5050,
    endpoint = ['http://localhost:5050/submit']
)

fund_agent_if_low(my_first_agent.wallet.address())

second_agent = "agent1qffqrx4a3dad4hyyujn5vqkksdgxpdsqhgxlj99d4emczyh99dxds94759l"
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
    ctx.logger.info(f"Received bill analysis response from {sender}")
    ctx.logger.info(f"Response: {msg}")
    # Process the response as needed
    # For example, you can print the total amount
    ctx.logger.info(f"Total Amount: {msg.total_amount} {msg.currency}")

if __name__ == "__main__":
    my_first_agent.run()