from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
import uuid
import requests
import json
from datetime import datetime
from model import BillAnalysisRequest, BillAnalysisResponse, BillItem, RequestA, RequestB, Response
from typing import Dict
import re

from uagent1 import call_relevant_agent


agent = Agent(name="Rest API",port=3333, endpoint=["http://localhost:3333"])

fund_agent_if_low(agent.wallet.address())
# # POST endpoint example
# @agent.on_rest_post("/rest/post", RequestA, Response)
# async def handle_postA(ctx: Context, req: RequestA) -> Response:
#     ctx.logger.info("Received POST request")
#     billRequest = req.text
#     #Call second_agent 
#     await call_relevant_agent(ctx, billRequest)
#     return Response(
#         text=f"Received: {req.text}",
#         agent_address=ctx.agent.address,
#         timestamp=123456789,
#     )

@agent.on_rest_post("/rest/post", RequestB, Response)
async def handle_postB(ctx: Context, req: RequestB) -> Response:
    ctx.logger.info("Received POST request")
    billRequest = BillAnalysisRequest(
        image_url=req.image_url,
        text_data=req.text,
        request_id=str(uuid.uuid4()),
        timestamp=datetime.now()
    )
    # Call second_agent 
    response = await call_relevant_agent(ctx, billRequest)
    # Serialize the model properly
    body_content = response[1].json()  # serialize Pydantic object to JSON string

    # Convert timestamp to UNIX integer

    return Response(
        body=str(body_content),
        agent_address=str(response[0]),
        time="datetime.now().timestamp()",
    )

if __name__ == "__main__":
    agent.run()
