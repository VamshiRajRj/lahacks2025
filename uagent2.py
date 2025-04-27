from uagents import Agent, Context
from model import BillAnalysisRequest, BillItem, BillAnalysisResponse
from uagents.setup import fund_agent_if_low
import requests
from io import BytesIO
from PIL import Image
import json
from typing import Dict, Optional, List
from datetime import datetime
import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

my_second_agent = Agent(
    name = 'My Second Agent',
    port = 5051,
    endpoint = ['http://localhost:5051/submit']
)

agent2_responses :  Dict[str, BillAnalysisResponse] = {}

fund_agent_if_low(my_second_agent.wallet.address())


def download_image(url: str) -> Image:
    response = requests.get(url)
    response.raise_for_status()
    img = Image.open(BytesIO(response.content))
    return img



async def extract_text_from_image(image_data: str) -> Optional[Dict]:
    """Extract text from image using Google's Gemini Vision model."""
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel("gemini-1.5-pro-latest")
        
        # Prepare the prompt
        prompt = """
        Please analyze this bill image and provide a detailed breakdown in JSON format.
        Focus on extracting:
        1. The establishment name
        2. Date of the bill
        3. All items with their individual prices and quantities
        4. Subtotal, tax, and total amounts
        5. Any special charges or discounts
        
        Format your response as a valid JSON object with this structure:
        {
            "request_id": "unique_id",
            "items": [
                {
                    "name": "Item name",
                    "price": 0.00,
                    "quantity": 1,
                    "total": 0.00
                }
            ],
            "total_amount": 0.00,
            "currency": "USD",
            "status": "completed",
            "metadata": {
                "establishment_name": "Name of the place",
                "date": "YYYY-MM-DD",
                "subtotal": 0.00,
                "tax": 0.00,
                "tax_rate": 0.00
            }
        }
        
        Important:
        - Ensure all numbers are formatted as decimal numbers (e.g., 10.99 not 10,99)
        - Make sure the JSON is valid and properly formatted
        - Include all visible items and charges
        - Calculate totals accurately
        """
        
        # Generate response from Gemini
        response = model.generate_content(
            contents=[prompt, image_data],
        )
        
        # Extract and parse the JSON from the response
        # Look for JSON content between triple backticks if present
        content = response.text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        # Parse the JSON content
        try:
            bill_data = json.loads(content)
            print("Parsed bill data:", json.dumps(bill_data, indent=2))
            return bill_data
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON from Gemini response: {str(e)}")
            return None
            
    except Exception as e:
        print(f"Error in Gemini image analysis: {str(e)}")
        return None

def parse_bill_items(bill_data: Dict) -> List[BillItem]:
    """Parse bill data into BillItem objects."""
    bill_items = []
    
    try:
        # Extract items from the structured data
        items = bill_data.get("items", [])
        for item in items:
            bill_item = BillItem(
                name=item.get("name", "Unknown Item"),
                price=float(item.get("price", 0.0)),
                quantity=int(item.get("quantity", 1)),
                total=float(item.get("total", 0.0))
            )
            bill_items.append(bill_item)
            
        # Add special charges as separate items if present
        special_charges = bill_data.get("special_charges", [])
        for charge in special_charges:
            bill_item = BillItem(
                name=charge.get("name", "Special Charge"),
                price=float(charge.get("amount", 0.0)),
                quantity=1,
                total=float(charge.get("amount", 0.0))
            )
            bill_items.append(bill_item)
            
        # Add tax as a separate item if present
        tax_amount = bill_data.get("tax", 0.0)
        if tax_amount > 0:
            bill_items.append(BillItem(
                name="Tax",
                price=tax_amount,
                quantity=1,
                total=tax_amount
            ))
            
    except Exception as e:
        print(f"Error parsing bill items: {str(e)}")
        return []
        
    return bill_items


@my_second_agent.on_event('startup')
async def startup_handler(ctx : Context):
    agent2_responses = ctx.storage.get("agent2_responses") or {}
    ctx.logger.info(f'My name is {ctx.agent.name} and my address  is {ctx.agent.address}')

@my_second_agent.on_message(model = BillAnalysisRequest)
async def message_handler(ctx: Context, sender : str, msg: BillAnalysisRequest):
    try:
        img = download_image(msg.image_url)
        if img:
            # Test direct ASI-1 mini call
            bill_data = await extract_text_from_image(img)
            # print("bill_data", bill_data)
            if bill_data:
                # Send the extracted data back to the sender
                bill_items = parse_bill_items(bill_data)
                if bill_items:
                       #     # Update response with parsed data
                       response = BillAnalysisResponse(
                                request_id = msg.request_id,
                                items = bill_items,
                                total_amount = sum(item.total for item in bill_items),
                                currency ="USD",
                                timestamp= datetime.now(),
                                status = "completed",
                                error = "",
                                metadata = {
                                    "establishment": bill_data.get("establishment"),
                                    "date": bill_data.get("date"),
                                    "original_subtotal": bill_data.get("subtotal"),
                                    "processing_timestamp": datetime.now().isoformat()
                                }
                        )
                try:
                    agent2_responses[msg.request_id] = response
                    # ctx.storage.set("agent2_responses", json(agent2_responses))
                    await ctx.send(sender, response)
                except Exception as e:
                    ctx.logger.error(f"Error sending response: {str(e)}")
            else:
                ctx.logger.error("Failed to extract text from image")
        else:
            ctx.logger.error("Failed to encode image")
    except Exception as e:
        ctx.logger.error(f"Error downloading image: {str(e)}")

if __name__ == "__main__":
    my_second_agent.run()