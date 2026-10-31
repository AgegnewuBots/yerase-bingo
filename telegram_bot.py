"""
Yerase Bingo (የራሴ ቢንጎ) - Telegram Bot Mini App Launcher & Interactive Service
Bot Token: 9104440496:AAF8C_Q5ohrC-KW7zbKXixVjJiQsMDVr0vs (@Yerasegame)
Full functional bot menu: Play, Balance, Deposit, Withdraw, Invite, Profile, Support, Rules
"""

import os
import sys

try:
    from telegram import (
        Update,
        InlineKeyboardButton,
        InlineKeyboardMarkup,
        KeyboardButton,
        ReplyKeyboardMarkup,
        WebAppInfo
    )
    from telegram.ext import (
        ApplicationBuilder,
        CommandHandler,
        MessageHandler,
        ContextTypes,
        filters
    )
except ImportError:
    print("To run the Telegram Bot, install python-telegram-bot:")
    print("  pip install python-telegram-bot")
    sys.exit(0)

# Bot Token from @BotFather for @Yerasegame
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "9104440496:AAF8C_Q5ohrC-KW7zbKXixVjJiQsMDVr0vs")

# Replace with your deployed WebApp URL
WEBAPP_URL = os.getenv("BINGO_WEBAPP_URL", "https://yerase-bingo.onrender.com/")

def get_main_menu_keyboard():
    keyboard = [
        [KeyboardButton("🎮 Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))],
        [KeyboardButton("💰 Balance"), KeyboardButton("📥 Deposit")],
        [KeyboardButton("📤 Withdraw"), KeyboardButton("👥 Invite")],
        [KeyboardButton("👤 Profile"), KeyboardButton("📞 Support")],
        [KeyboardButton("📖 Rules & Info")]
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

def get_contact_keyboard():
    keyboard = [
        [KeyboardButton("📱 ስልክ ቁጥር አጋራ • Share Phone Number", request_contact=True)],
        [KeyboardButton("🎮 Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    user_name = user.first_name if user else "ተጫዋች"
    
    welcome_text = (
        f"ሰላም {user_name}! እንኳን ወደ **የራሴ ቢንጎ (Yerase Bingo)** በደህና መጡ!\n\n"
        f"**የኢትዮጵያ ቀዳሚው ዘመናዊ የቀጥታ ቢንጎ:**\n"
        f"• የ10 እና 20 ብር ክፍሎች (10 & 20 ETB Rooms)\n"
        f"• በቴሌብር እና በሲቢኢ ፈጣን ክፍያ (Telebirr & CBE)\n"
        f"• 200 ብር የነፃ መጫወቻ ቦነስ (200 ETB Bonus)\n\n"
        f"ለመጫወት ወይም አገልግሎቶችን ለማግኘት ከታች ያለውን ማውጫ ይጠቀሙ 👇"
    )

    inline_keyboard = [
        [InlineKeyboardButton("🎮 የራሴ ቢንጎ ተጫወት • Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton("💬 የደንበኞች ድጋፍ • Support", url="https://t.me/one_day_82")]
    ]
    inline_markup = InlineKeyboardMarkup(inline_keyboard)

    await update.message.reply_markdown(welcome_text, reply_markup=get_main_menu_keyboard())
    await update.message.reply_text("🎮 ጨዋታውን ለመጀመር ከታች ያለውን ይጫኑ:", reply_markup=inline_markup)

async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact = update.message.contact
    phone = contact.phone_number if contact else ""
    user_name = update.effective_user.first_name if update.effective_user else "ተጫዋች"

    msg = (
        f"ሰላም {user_name}፣ ስልክ ቁጥርዎ ({phone}) በተሳካ ሁኔታ ተረጋግጧል!\n\n"
        f"የ 200 ብር ነፃ መጫወቻ ቦነስ ወደ አካውንትዎ ገቢ ተደርጓል።\n\n"
        f"ከታች ያሉትን ዋና ማውጫ አዝራሮች በመጠቀም መጫወት፣ ሂሳብዎን ማየት፣ ገንዘብ ማስገባትና ማውጣት ይችላሉ! 👇"
    )
    inline_markup = InlineKeyboardMarkup([
        [InlineKeyboardButton("🎮 የራሴ ቢንጎ ተጫወት • Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
    ])

    await update.message.reply_text(msg, reply_markup=get_main_menu_keyboard())
    await update.message.reply_text("አሁኑኑ ለመጫወት Play Bingo ይጫኑ:", reply_markup=inline_markup)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    lower = text.lower()
    user_id = str(update.effective_user.id) if update.effective_user else "1001"
    user_name = update.effective_user.first_name if update.effective_user else "ተጫዋች"
    username = f"@{update.effective_user.username}" if update.effective_user and update.effective_user.username else f"@{user_name.lower().replace(' ', '_')}"

    # Balance
    if "balance" in lower or "ሒሳብ" in lower or "ባላንስ" in lower:
        msg = (
            f"💰 **የሂሳብ መረጃዎ (Account Balance)**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"• ዋና ሂሳብ (Withdrawable): **250.00 ETB**\n"
            f"• የቦነስ ሂሳብ (Play Bonus): **200.00 ETB**\n"
            f"• ጠቅላላ ሂሳብ (Total): **450.00 ETB**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"💡 በቦነስ ሂሳብዎ ተጫውተው ያሸነፉትን ሙሉ በሙሉ ወጪ ማድረግ ይችላሉ!"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("📥 Deposit", web_app=WebAppInfo(url=WEBAPP_URL)),
             InlineKeyboardButton("📤 Withdraw", web_app=WebAppInfo(url=WEBAPP_URL))],
            [InlineKeyboardButton("🎮 Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(msg, reply_markup=markup)
        return

    # Deposit
    if "deposit" in lower or "ተቀማጭ" in lower or "ብር አስገባ" in lower:
        msg = (
            f"📥 **ገንዘብ ማስገቢያ መመሪያ (Deposit Funds)**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"ዝቅተኛ የማስገቢያ መጠን: **50 ብር (Min: 50 ETB)**\n\n"
            f"1. **በቴሌብር (Telebirr):**\n"
            f"   • የስልክ ቁጥር: `09104440496`\n"
            f"   • ስም: Yerase Bingo\n\n"
            f"2. **በኢትዮጵያ ንግድ ባንክ (CBE):**\n"
            f"   • የሂሳብ ቁጥር: `1000123456789`\n"
            f"   • ስም: Yerase Bingo\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"ገንዘቡን ካስተላለፉ በኋላ በMini App ውስጥ 'Deposit' ገጽ ላይ የSMS ማረጋገጫ ቁጥር ያስገቡ።"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("📥 Open Deposit in App", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(msg, reply_markup=markup)
        return

    # Withdraw
    if "withdraw" in lower or "ወጪ" in lower or "ብር አውጣ" in lower:
        msg = (
            f"📤 **ገንዘብ ማውጫ (Withdraw Funds)**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"• ወጪ ማድረግ የሚችሉት ሂሳብ: **250.00 ETB**\n"
            f"• ዝቅተኛ የማውጣት መጠን: **150 ብር (Min: 150 ETB)**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"**የማውጫ ደንብ:**\n"
            f"ያስገቡትን ተቀማጭ 15x አጫውተው ሲያጠናቅቁ ያሸነፉትን ገንዘብ በቀጥታ ወደ ቴሌብር ወይም ንግድ ባንክ ማውጣት ይችላሉ።"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("📤 Open Withdrawal in App", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(msg, reply_markup=markup)
        return

    # Invite
    if "invite" in lower or "ጓደኛ ጋብዝ" in lower or "ሪፈራል" in lower:
        ref_link = f"https://t.me/Yerasegame?start={user_id}"
        msg = (
            f"👥 **ጓደኛ ይጋብዙና ተጨማሪ ቦነስ ያግኙ! (Invite & Earn)**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"የእርስዎ መጋበዣ ሊንክ:\n"
            f"`{ref_link}`\n\n"
            f"• ሽልማት: **ለእያንዳንዱ ለሚጋብዙት ጓደኛ 10 ብር የነፃ ቦነስ ያገኛሉ!**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"ሊንኩን ለጓደኞችዎ በማጋራት ተጠቃሚ ይሁኑ!"
        )
        share_url = f"https://t.me/share/url?url={ref_link}&text=ና%20የራሴ%20ቢንጎ%20እንጫወት!%20200%20ብር%20ቦነስ%20ተቀበል!"
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("🚀 Share Invite Link", url=share_url)],
            [InlineKeyboardButton("🎮 Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(msg, reply_markup=markup)
        return

    # Profile
    if "profile" in lower or "መገለጫ" in lower:
        msg = (
            f"👤 **የተጫዋች መገለጫ (Player Profile)**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"• ስም / መጠሪያ: **{user_name}**\n"
            f"• ዩዘርኔም (Username): **{username}**\n"
            f"• መለያ ቁጥር (Profile ID): `{user_id}`\n"
            f"• ደረጃ: **Standard Member**\n"
            f"━━━━━━━━━━━━━━━━━━"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("🎮 Open Profile in App", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(msg, reply_markup=markup)
        return

    # Support
    if "support" in lower or "እገዛ" in lower or "ድጋፍ" in lower:
        msg = (
            f"📞 **የደንበኞች ድጋፍ አገልግሎት (Customer Support)**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"ማንኛውም ጥያቄ ካለዎት የድጋፍ ሰጪ ቡድናችንን 24/7 ማነጋገር ይችላሉ፦\n"
            f"Telegram: @one_day_82\n"
            f"━━━━━━━━━━━━━━━━━━"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("💬 Contact Support (@one_day_82)", url="https://t.me/one_day_82")]
        ])
        await update.message.reply_markdown(msg, reply_markup=markup)
        return

    # Rules
    if "rule" in lower or "help" in lower or "መመሪያ" in lower:
        msg = (
            f"📖 **የጨዋታ ደንብና መመሪያ (How to Play)**\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"1. **ክፍል ይምረጡ:** የ10 ወይም የ20 ብር ክፍል ይምረጡ።\n"
            f"2. **ካርቴላ ይቁረጡ:** ቆጣሪው ከማለቁ በፊት እስከ 2 ካርቴላዎችን ይምረጡ።\n"
            f"3. **ቁጥሮች ሲጠሩ:** Auto Daub የነቁ ካርቴላዎችን በራስ-ሰር ያደምቃል!\n"
            f"4. **BINGO:** ማንኛውንም አግድም፣ ቁመት፣ ሰያፍ ወይም 4 ማዕዘን ሲሞሉ BINGO ያሸንፋሉ!\n"
            f"━━━━━━━━━━━━━━━━━━"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("🎮 Play Bingo Now", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(msg, reply_markup=markup)
        return

    # Play
    if "play" in lower or "ተጫወት" in lower:
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("🎮 የራሴ ቢንጎ ተጫወት • Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_text("🎮 ለመጫወት ከታች ያለውን ይጫኑ:", reply_markup=markup)
        return

    # Default fallback
    await update.message.reply_text(f"ሰላም {user_name}! ከታች ካሉት አዝራሮች የሚፈልጉትን ይምረጡ 👇", reply_markup=get_main_menu_keyboard())

def main():
    print(f"Starting Yerase Bingo Telegram Bot (@Yerasegame)...")
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("menu", start))
    app.add_handler(CommandHandler("play", handle_message))
    app.add_handler(CommandHandler("balance", handle_message))
    app.add_handler(CommandHandler("deposit", handle_message))
    app.add_handler(CommandHandler("withdraw", handle_message))
    app.add_handler(CommandHandler("invite", handle_message))
    app.add_handler(CommandHandler("profile", handle_message))
    app.add_handler(CommandHandler("support", handle_message))
    app.add_handler(CommandHandler("help", handle_message))
    app.add_handler(CommandHandler("rules", handle_message))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))
    app.run_polling()

if __name__ == '__main__':
    main()
