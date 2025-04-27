from uagents import Agent, Context
import requests
from PIL import Image
from io import BytesIO
from uagents.setup import fund_agent_if_low
import json
from typing import Dict, List, Optional
import google.generativeai as genai
from models.model import BillItem, BillAnalysisRequest

GEMINI_API_KEY="AIzaSyDOXulkdexqsIWSTMquk6eEb-C8MAChAK4"
# Supported file types for bill images
SUPPORTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.pdf']

# Maximum file size (in bytes) - 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024 

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Agent-1
analysis_agent = Agent(
    name="Analysis Agent",
    port=8001,
    endpoint=['http://localhost:8001/submit'],
)

fund_agent_if_low(analysis_agent.wallet.address())


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

def download_image(url):
    response = requests.get(url)
    response.raise_for_status()  # Raise error if download fails
    img = Image.open(BytesIO(response.content))
    return img

@analysis_agent.on_event("startup")
async def on_startup(ctx: Context):
    """Initialize the bill analysis agent."""
    ctx.logger.info("Bill Analysis Agent started")


@analysis_agent.on_message(model = BillAnalysisRequest)
async def handle_bill_analysis(ctx: Context, sender: str, msg: BillAnalysisRequest):
    """Handle incoming bill analysis requests."""
    ctx.logger.info(f"Received bill analysis request from {sender}")
    
    # try:
    #     image_data = download_image(msg.image_url)
    #     if image_data:
    #         # Test direct ASI-1 mini call
    #         bill_data = await extract_text_from_image(image_data)
    #         # print("bill_data", bill_data)
    #         ctx.logger.info("Raw ASI-1 response:")
    #         ctx.logger.info(json.dumps(bill_data, indent=2))
    #     else:
    #         ctx.logger.error("Failed to encode image")
    #     # Initialize response
    #     response = BillAnalysisResponse(
    #         request_id=msg.request_id,
    #         items=[],
    #         total_amount=0.0,
    #         status="processing",
    #         currency= "USD",
    #         timestamp = datetime.now(),
    #         error = "",
    #         metadata= {},
    #     )
        
    #     if not bill_data:
    #         response.status = "error"
    #         response.error = "No valid bill data could be extracted"
    #         await ctx.send(sender, response)
    #         return

    #     # Parse items from the bill data
    #     bill_items = parse_bill_items(bill_data)
        
    #     if not bill_items:
    #         response.status = "error"
    #         response.error = "Failed to parse bill items"
    #         await ctx.send(sender, response)
    #         return

    #     # Update response with parsed data
    #     response.items = bill_items
    #     response.total_amount = sum(item.total for item in bill_items)
    #     response.status = "completed"
    #     response.metadata = {
    #         "establishment": bill_data.get("establishment"),
    #         "date": bill_data.get("date"),
    #         "original_subtotal": bill_data.get("subtotal"),
    #         "processing_timestamp": datetime.now().isoformat()
    #     }

    #     # Send response back
    #     await ctx.send(sender, response)
        
    # except Exception as e:
    #     ctx.logger.error(f"Error processing bill analysis: {str(e)}")
    #     response = BillAnalysisResponse(
    #         request_id=msg.request_id,
    #         items=[],
    #         total_amount=0.0,
    #         status="error",
    #         error=str(e)
    #     )
    #     await ctx.send(sender, response)

if __name__ == "__main__":
    analysis_agent.run() 