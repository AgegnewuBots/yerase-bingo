"""
Yerase Bingo (የራሴ ቢንጎ) - Telegram Bot Mini App Launcher
Run this script to connect your Telegram Bot with the Yerase Bingo Mini App!

Requirements:
    pip install python-telegram-bot

Usage:
    1. Create a bot with @BotFather on Telegram (get your BOT_TOKEN).
    2. Deploy Yerase Bingo on Vercel, Netlify, or ngrok (e.g., https://your-domain.vercel.app).
    3. Put your BOT_TOKEN and WEBAPP_URL below.
    4. Run: python telegram_bot.py
"""

import os
import sys

try:
    from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
    from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
except ImportError:
    print("To run the Telegram Bot, install python-telegram-bot:")
    print("  pip install python-telegram-bot")
    sys.exit(0)

# Replace with your Telegram Bot Token from @BotFather
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN_HERE")

# Replace with your deployed WebApp URL
WEBAPP_URL = os.getenv("BINGO_WEBAPP_URL", "https://yerase-bingo.onrender.com/")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_name = update.effective_user.first_name if update.effective_user else "ተጫዋች"
    
    welcome_text = (
        f"🇪🇹 ሰላም {user_name}! እንኳን ወደ **የራሴ ቢንጎ (Yerase Bingo)** በደህና መጡ!\n\n"
        f"🏆 **የኢትዮጵያ ቀዳሚው ዘመናዊ የቀጥታ ቢንጎ:**\n"
        f"• የ10 እና 20 ብር ክፍሎች (10 & 20 ETB Cartela Rooms)\n"
        f"• እስከ 400 ተጫዋቾች በአንድ ዙር (Up to 400 live players)\n"
        f"• እስከ 8,000 ብር የጃክፖት ሽልማት (Big Pot Prizes)\n"
        f"• በቴሌብር እና በሲቢኢ ብር ፈጣን ክፍያ (Telebirr & CBE Birr)\n\n"
        f"ለመጫወት ከታች ያለውን **'Play Yerase Bingo'** ቁልፍ ይጫኑ! 👇"
    )

    keyboard = [
        [
            InlineKeyboardButton(
                text="🎮 የራሴ ቢንጎ ተጫወት • Play Bingo",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ],
        [
            InlineKeyboardButton(
                text="💬 የቡድን ውይይት (Community Group)",
                url="https://t.me/"
            )
        ]
    ]

    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_markdown(welcome_text, reply_markup=reply_markup)

def main():
    if BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN_HERE":
        print("[!] Note: Set your TELEGRAM_BOT_TOKEN from @BotFather in telegram_bot.py or via environment variable.")
    print("Starting Yerase Bingo Telegram Bot...")
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.run_polling()

if __name__ == '__main__':
    main()
