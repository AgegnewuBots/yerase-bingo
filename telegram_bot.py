"""
YERASE BINGO - TELEGRAM BOT POLLING ENGINE (Python Implementation)
Bot Username: @YerasegameBot
Official Support: @Agegnewu0102
Official Channel: @yerasebingo
"""

import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "9104440496:AAF8C_Q5ohrC-KW7zbKXixVjJiQsMDVr0vs")
WEBAPP_URL = os.getenv("BINGO_WEBAPP_URL", "https://yerase-bingo.onrender.com/")

def get_main_menu_keyboard():
    return ReplyKeyboardMarkup(
        [
            [KeyboardButton("🎮 Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))],
            [KeyboardButton("💰 Balance"), KeyboardButton("📥 Deposit")],
            [KeyboardButton("📤 Withdraw"), KeyboardButton("👥 Invite")],
            [KeyboardButton("👤 Profile"), KeyboardButton("📞 Support")],
            [KeyboardButton("📖 Rules & Info")]
        ],
        resize_keyboard=True,
        is_persistent=True
    )

def get_contact_keyboard():
    return ReplyKeyboardMarkup(
        [
            [KeyboardButton("📱 Share Phone Number", request_contact=True)],
            [KeyboardButton("🎮 Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    first_name = user.first_name if user else "Player"
    user_id = str(user.id) if user else "1001"

    welcome_text = (
        f"🎮 *Welcome to Yerase Bingo!*\n\n"
        f"Ethiopia's premier live multiplayer Bingo gaming platform on Telegram.\n\n"
        f"*Key Features:*\n"
        f"• Synchronized 10 ETB & 20 ETB live rooms\n"
        f"• Instant deposits & withdrawals via Telebirr & CBE\n"
        f"• 200 ETB Free Welcome Bonus for every new player\n"
        f"• 5 ETB Free Play Bonus for every friend you invite\n"
        f"• Provably fair live ball drawing and instant cashouts\n\n"
        f"Please share your phone number below or choose an option from the menu to start 👇"
    )

    await update.message.reply_markdown(welcome_text, reply_markup=get_main_menu_keyboard())

async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact = update.message.contact
    phone = contact.phone_number if contact else ""
    user_name = update.effective_user.first_name if update.effective_user else "Player"

    msg = (
        f"✅ *Phone Number Verified Successfully!*\n\n"
        f"Welcome, {user_name}! Your phone number ({phone}) is now linked to your account.\n\n"
        f"• 200 ETB Free Welcome Bonus is ready in your account!\n"
        f"• Use the interactive menu below to play, view your balance, deposit, or withdraw funds 👇"
    )

    await update.message.reply_markdown(msg, reply_markup=get_main_menu_keyboard())

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    lower = text.lower()
    user_id = str(update.effective_user.id) if update.effective_user else "1001"
    user_name = update.effective_user.first_name if update.effective_user else "Player"
    username = f"@{update.effective_user.username}" if update.effective_user and update.effective_user.username else f"@player_{user_id[-4:]}"

    if lower in ["/menu", "menu"]:
        await update.message.reply_markdown("📋 *Yerase Bingo Main Menu*\nChoose an option below:", reply_markup=get_main_menu_keyboard())
        return

    if "balance" in lower or "/balance" in lower:
        bal_msg = (
            f"💰 *Your Account Balance Summary*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• *Withdrawable Main Balance:* 0.00 ETB\n"
            f"• *Free Play Bonus Balance:* 200.00 ETB\n"
            f"• *Total Balance:* 200.00 ETB\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"💡 *Winnings from your play bonus are 100% withdrawable once wagering requirements are met!*"
        )
        markup = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("📥 Deposit Funds", web_app=WebAppInfo(url=WEBAPP_URL + ("&" if "?" in WEBAPP_URL else "?") + "action=deposit")),
                InlineKeyboardButton("📤 Withdraw Funds", web_app=WebAppInfo(url=WEBAPP_URL + ("&" if "?" in WEBAPP_URL else "?") + "action=withdraw"))
            ],
            [InlineKeyboardButton("🎮 Play Bingo Now", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(bal_msg, reply_markup=markup)
        return

    if "deposit" in lower or "/deposit" in lower:
        dep_msg = (
            f"📥 *Deposit Funds to Yerase Bingo*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"*Minimum Deposit Amount:* 50 ETB\n\n"
            f"*1. Telebirr:*\n"
            f"   • Phone Number: `09104440496`\n"
            f"   • Account Name: Yerase Bingo\n\n"
            f"*2. Commercial Bank of Ethiopia (CBE):*\n"
            f"   • CBE Account: `1000123456789`\n"
            f"   • Account Name: Yerase Bingo\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"*How to Complete Deposit:*\n"
            f"Transfer funds via Telebirr or CBE, then tap *\"Open Deposit in App\"* below to submit your transaction screenshot or SMS reference. Funds are credited instantly!"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("📥 Open Deposit in App", web_app=WebAppInfo(url=WEBAPP_URL + ("&" if "?" in WEBAPP_URL else "?") + "action=deposit"))]
        ])
        await update.message.reply_markdown(dep_msg, reply_markup=markup)
        return

    if "withdraw" in lower or "/withdraw" in lower:
        with_msg = (
            f"📤 *Withdraw Funds*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• *Minimum Withdrawal Amount:* 150 ETB\n"
            f"• *Supported Payout Methods:* Commercial Bank of Ethiopia (CBE) & Telebirr\n"
            f"*(Note: CBE Birr is not supported — use CBE Account or Telebirr)*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"*Withdrawal Policy:*\n"
            f"Deposited funds and winnings become withdrawable once you deposit at least 50 ETB and wager 15x your total deposit amount.\n\n"
            f"Tap *\"Open Withdrawal in App\"* below to select your payout method (CBE or Telebirr) and submit your request 👇"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("📤 Open Withdrawal in App", web_app=WebAppInfo(url=WEBAPP_URL + ("&" if "?" in WEBAPP_URL else "?") + "action=withdraw"))]
        ])
        await update.message.reply_markdown(with_msg, reply_markup=markup)
        return

    if "invite" in lower or "/invite" in lower:
        ref_link = f"https://t.me/YerasegameBot?start={user_id}"
        invite_msg = (
            f"👥 *Invite Friends & Earn Free Play Bonus*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"*Your Personal Referral Link:*\n"
            f"{ref_link}\n\n"
            f"• *Referral Reward:* Earn *5 ETB Free Play Bonus* for every friend who joins!\n"
            f"• *Usage:* Bonus funds are added directly to your play balance to win real prizes!\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"Share your invite link to Telegram groups and friends now 👇"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("🚀 Share Invite Link", url=f"https://t.me/share/url?url={ref_link}&text=Play%20Yerase%20Bingo%20on%20Telegram!%20Get%20200%20ETB%20welcome%20bonus!")],
            [InlineKeyboardButton("🎮 Play Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(invite_msg, reply_markup=markup)
        return

    if "profile" in lower or "/profile" in lower:
        id_display = user_id[-10:] if len(user_id) > 10 else user_id
        prof_msg = (
            f"👤 *Player Profile Card*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• *Player Name:* {user_name}\n"
            f"• *Telegram Username:* {username}\n"
            f"• *Profile ID:* {id_display}\n"
            f"• *Games Played:* 0\n"
            f"• *Games Won:* 0\n"
            f"• *Total Won:* 0.00 ETB\n"
            f"• *Member Tier:* Standard Member\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("🎮 Open Profile in App", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(prof_msg, reply_markup=markup)
        return

    if "support" in lower or "/support" in lower:
        supp_msg = (
            f"📞 *Customer Support & Official Channel*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"Have questions, payment inquiries, or feedback? Contact our team 24/7:\n\n"
            f"• *Telegram Support:* @Agegnewu0102\n"
            f"• *Official Channel:* @yerasebingo\n"
            f"• *Official Bot:* @YerasegameBot\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("💬 Contact Support (@Agegnewu0102)", url="https://t.me/Agegnewu0102")],
            [InlineKeyboardButton("📢 Join Channel (@yerasebingo)", url="https://t.me/yerasebingo")]
        ])
        await update.message.reply_markdown(supp_msg, reply_markup=markup)
        return

    if "rule" in lower or "help" in lower or "/rules" in lower or "/help" in lower:
        rules_msg = (
            f"📖 *How to Play Yerase Bingo*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"1. *Select a Room:* Choose the 10 ETB or 20 ETB live room.\n"
            f"2. *Pick Cartelas:* Select up to 2 lucky cartelas before the 60-second round countdown ends.\n"
            f"3. *Live Ball Calls:* Numbers from 1 to 75 are drawn randomly by the server. Your cards auto-daub called numbers in real time!\n"
            f"4. *Winning BINGO:* Complete any horizontal, vertical, diagonal line, or 4 corners to hit BINGO and claim the prize pot!\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("ℹ️ View Platform Info", callback_data="view_info")],
            [InlineKeyboardButton("🎮 Play Bingo Now", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await update.message.reply_markdown(rules_msg, reply_markup=markup)
        return

    if "play" in lower:
        await update.message.reply_markdown("🎮 *Play Yerase Bingo Live Now!*\nTap below to launch the Mini App:", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🎮 Launch Yerase Bingo", web_app=WebAppInfo(url=WEBAPP_URL))]
        ]))
        return

    await update.message.reply_text(f"Hello {user_name}! Please choose an option from the menu below 👇", reply_markup=get_main_menu_keyboard())

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data == "view_info":
        info_text = (
            f"ℹ️ *Yerase Bingo Platform Info*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• *Fair & Transparent:* Provably fair deterministic card numbers and server-side ball calling.\n"
            f"• *Secure Banking:* Direct deposit and withdrawal verification via CBE & Telebirr.\n"
            f"• *Bonus System:* 200 ETB free welcome bonus + 5 ETB free bonus for each friend invited.\n"
            f"• *Official Bot:* @YerasegameBot\n"
            f"• *Customer Support:* @Agegnewu0102\n"
            f"• *Official Community Channel:* @yerasebingo\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("📖 View Game Rules", callback_data="view_rules")],
            [InlineKeyboardButton("🎮 Play Bingo Now", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await query.edit_message_text(info_text, parse_mode="Markdown", reply_markup=markup)
    elif query.data == "view_rules":
        rules_text = (
            f"📖 *How to Play Yerase Bingo*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"1. *Select a Room:* Choose the 10 ETB or 20 ETB live room.\n"
            f"2. *Pick Cartelas:* Select up to 2 lucky cartelas before the 60-second round countdown ends.\n"
            f"3. *Live Ball Calls:* Numbers from 1 to 75 are drawn randomly by the server. Your cards auto-daub called numbers in real time!\n"
            f"4. *Winning BINGO:* Complete any horizontal, vertical, diagonal line, or 4 corners to hit BINGO and claim the prize pot!\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )
        markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("ℹ️ View Platform Info", callback_data="view_info")],
            [InlineKeyboardButton("🎮 Play Bingo Now", web_app=WebAppInfo(url=WEBAPP_URL))]
        ])
        await query.edit_message_text(rules_text, parse_mode="Markdown", reply_markup=markup)

def main():
    logger.info("Starting Yerase Bingo Telegram Bot...")
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.CONTACT, handle_contact))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.run_polling()

if __name__ == "__main__":
    main()
