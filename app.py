from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
import openai
import os
from dotenv import load_dotenv
from sentiment import analyze_sentiment
from database import log_interaction

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Homepage route
@app.route("/")
def home():
    return "WhatsApp GPT Bot is Running!"

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Function to get GPT reply
def get_bot_reply(user_input):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers clearly and briefly."},
                {"role": "user", "content": user_input},
            ]
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        return "Sorry, something went wrong with the chatbot."

# WhatsApp webhook
@app.route("/whatsapp", methods=["POST"])
def whatsapp_bot():
    incoming_msg = request.values.get("Body", "").strip()
    sender = request.values.get("From")

    # Analyze sentiment
    sentiment = analyze_sentiment(incoming_msg)

    # Get chatbot reply
    reply = get_bot_reply(incoming_msg)

    # Log to DB
    log_interaction(sender, incoming_msg, reply, sentiment)

    # Send reply
    twilio_response = MessagingResponse()
    twilio_response.message(reply)
    return str(twilio_response)

# Run app
if __name__ == "__main__":
    app.run(debug=True)
