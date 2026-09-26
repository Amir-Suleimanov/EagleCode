def application_message(competition_title: str, status: str) -> tuple[str, str]:
    approved = status == "approved"
    decision = "участие подтверждено" if approved else "заявка отклонена"
    return (
        "Заявка одобрена" if approved else "Заявка отклонена",
        f"Решение по соревнованию «{competition_title}»: {decision}.",
    )


def meters_message(amount: int, reason: str) -> tuple[str, str]:
    return "Рейтинг обновлён", f"{amount:+d} м. {reason}"
