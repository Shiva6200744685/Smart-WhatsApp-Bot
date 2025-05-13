from textblob import TextBlob
import sys

def analyze_sentiment(text):
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity

    if polarity > 0:
        return "positive"
    elif polarity < 0:
        return "negative"
    else:
        return "neutral"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text = sys.argv[1]
        print(analyze_sentiment(text))
    else:
        print("neutral")