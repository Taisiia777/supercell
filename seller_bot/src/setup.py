from aiogram import Bot, types


async def set_commands(bot: Bot):
    await bot.set_my_commands(
        commands=[
            types.BotCommand(command="waiting_orders", description="Заказы на сборке"),
        ],
        scope=types.BotCommandScopeAllPrivateChats(),
    )


async def delete_commands(bot: Bot):
    await bot.delete_my_commands(scope=types.BotCommandScopeAllPrivateChats())
